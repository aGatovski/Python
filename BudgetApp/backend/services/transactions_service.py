import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from services.merchant_service import _lookup_merchant, get_categories, _save_merchant, get_training_data
from google import genai
from google.genai import types
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
import numpy as np

load_dotenv()

_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
_CHAT_MODEL = "gemini-2.5-flash"

# Load the model
model = SentenceTransformer('all-MiniLM-L6-v2')
merchants, categories = get_training_data()

# Convert all merchant names to embeddings at once
# Passing a list [] ensures X is a 2D array (n_samples, 384)
X = model.encode(merchants) 
y = categories

# Train the classifier on the full dataset
classifier = LogisticRegression(max_iter=1000)
classifier.fit(X, y)

def categorize_transaction(description: str, db: Session) -> str:
    """Categorize a transaction description."""
    description = description.lower().strip()
    # Use [description] to ensure the output is 2D
    new_vector = model.encode([description]) 
    
    prediction = classifier.predict(new_vector)
    # predict_proba returns a 2D array; we get max of the first (and only) row
    probabilities = classifier.predict_proba(new_vector)
    confidence = np.max(probabilities)

    print(f"Merchant: {description} | Category: {prediction[0]} | Confidence: {confidence:.2f}")
    if confidence > 0.5:  
        return str(prediction[0]) 

    # If confidence is low, ask the LLM for help
    prompt = (
        f"The transaction is '{description}'. My ML model thinks it is '{prediction}', "
        f"but it's not sure. Categorize this into: Groceries, Transfer, Activity, "
        f"Food & Dining, Entertainment, or Other. Return ONLY the category name."
    )
    try:
        response = _client.models.generate_content(
        model=_CHAT_MODEL, 
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.1,  # deterministic output
            max_output_tokens=20,  # short response
            )
        )

        if response and response.text:
            llm_category = response.text.strip()
        else:
            # Check why it failed 
            finish_reason = response.candidates[0].finish_reason if response.candidates else "No Candidates"
            print(f"Warning: LLM returned empty response for '{description}'. Reason: {finish_reason}")
            llm_category = "Other" # Safe default
    except Exception as e:
        print(f"Error calling LLM for '{description}': {e}")
        llm_category = "Other" # Safe default

    # Save the LLM's answer back to the DB 
    # This fine-tunes the ML model's training data automatically
    _save_merchant(description, llm_category, db)
    
    return llm_category