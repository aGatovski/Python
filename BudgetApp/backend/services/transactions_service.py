import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from services.merchant_service import _lookup_merchant, get_categories, _save_merchant
from google import genai
from google.genai import types

load_dotenv()

_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
_CHAT_MODEL = "gemini-2.5-flash"

def categorize_transaction(description: str, db: Session) -> str:
    """Categorize a transaction description."""
    # 1. Check merchant cache first
    merchant_category = _lookup_merchant(description.lower())

    if merchant_category:
        return merchant_category
    
    # 2. If not found, use AI model to categorize
    categories = get_categories()
    prompt = (
    "You are a personal finance assistant. "
    "Given the following transaction description, categorize it into one of these categories: "
    f"{', '.join(categories)}, or Other.\n\n"
    f"Transaction Description: '{description}'\n\n"
    "Respond with the single best category from the list. If the description does not clearly fit into any of the provided categories, respond with 'Other'."
   )

    response = _client.models.generate_content(
        model=_CHAT_MODEL, 
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.2,  # deterministic output
            max_output_tokens=10,  # short response
            )
    )

    best_match = response.text.strip()
    _save_merchant(description, best_match, db) 
    
    return best_match