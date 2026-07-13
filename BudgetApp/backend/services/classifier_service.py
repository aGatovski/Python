import re
import os
import numpy as np
import joblib
from google import genai
from google.genai import types
from functools import lru_cache
from pathlib import Path
from typing import Tuple
from dotenv import load_dotenv

PREFIX_PATTERNS = [
    r"^money added via\s+",
    r"^card payment to\s+",
    r"^payment to\s+",
    r"^payment from\s+",
    r"^exchanged to\s+",
    r"^to\s+",
    r"^from\s+",
]

_ML_DIR = Path(__file__).parent.parent / "models" / "ml"
CONFIDENCE_THRESHOLD = 0.50

load_dotenv()
_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
_CHAT_MODEL = "gemini-2.5-flash"


@lru_cache(maxsize=1)
def load_bundle() -> dict:
    path = _ML_DIR / "transaction_classifier.joblib"
    if not path.exists():
        raise FileNotFoundError(f"Model bundle not found at {path}."
                                "Run training pipeline and copy transaction_classifier.joblib into backend/models/ml/.")
    return joblib.load(path)


async def categorize_transaction(tx_type: str, amount: float, description: str, merchant:str) -> Tuple[str, str]:
    """Categorize a transaction. Returns a tuple[category, source]"""

    prediction, confidence = predict_category(tx_type=tx_type, amount=amount, merchant=merchant, desc_clean=description)

    if confidence >= 0.5:
        return prediction, "model"

    categories = load_bundle()["label_encoder"].classes_

    # If confidence is low, ask the LLM for help
    prompt = (
      f"Categorize this bank transaction into exactly one category from the list below.\n"
      f"Reply with ONLY the category name, exactly as written. No punctuation, no explanation.\n\n"
      f"Valid categories:\n{" ".join(categories)}\n\n"
      f"Transaction:\n"
      f"  Type: {tx_type}\n"
      f"  Amount: {amount} EUR\n"
      f"  Merchant: {merchant}\n"
      f"  Description: {description}\n\n"
      f"  Category:"
    )

    try:
        response = await _client.aio.models.generate_content(
        model=_CHAT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=20,
            )
        )

        if not response or not response.text:
            print(f"LLM returned empty response for {merchant}.")
            return "Other", "fallback"

        if response.text.strip() in categories:
            return response.text.strip(), "llm"

        else:
            return "Other", "fallback"

    except genai.errors.APIError as e:
        print(f"Gemini API error for {merchant}: {e}")
        return "Other", "fallback"

    except genai.errors.ClientError as e:
        print(f"Gemini client error for {merchant}: {e}")
        return "Other", "fallback"

    except Exception as e:
        print(f"Unexpected error when calling LLM for {merchant}: {e}")
        return "Other", "fallback"


def predict_category(
        tx_type: str,
        amount: float,
        merchant: str,
        desc_clean: str,
) -> tuple[str, float]:
    """"Return (category_label, confidence) for a single transaction."""
    bundle = load_bundle()

    sign = "income" if amount > 0 else "expense"
    text = f"{tx_type} | {sign} | {merchant} | {desc_clean}"

    label_encoder = bundle["label_encoder"]
    classifier = bundle["classifier"]

    if bundle["kind"] in ("tfidf_logreg", "tfidf_svm"):
        X = bundle["vectorizer"].transform([text])
        if bundle["kind"] == "tfidf_svm":
            # LinearSVC has no predict_proba. We use decision_function + softmax

            scores = classifier.decision_function(X)[0]
            exp_s = np.exp(scores - scores.max())
            probs = exp_s / exp_s.sum()
        else:
            probs = classifier.predict_proba(X)[0]
    else:
        from sentence_transformers import SentenceTransformer
        encoder = SentenceTransformer(bundle["encoder_name"])
        X = encoder.encode([text], convert_to_numpy=True)
        probs = classifier.predict_proba(X)[0]
    
    pred_idx = int(np.argmax(probs))
    confidence = float(probs[pred_idx])
    label = label_encoder.inverse_transform([pred_idx])[0]
    return label, confidence


def clean_description(text: str) -> str:
    """Description cleaning. Lowercase, strip, remove noise."""
    if not isinstance(text,str):
        return ""
    t = text.lower().strip()
    t = re.sub(r"\s+", " ", t)             
    t = re.sub(r"\d{4,}", "", t)            
    t = re.sub(r"[^\w\s\-&./]", " ", t)     
    t = re.sub(r"\s+", " ", t).strip()
    return t

def extract_merchant(desc_clean: str) -> str:
    """Extract merchant name. """
    if not desc_clean:
        return ""
    for pat in PREFIX_PATTERNS:
        if re.match(pat, desc_clean):
            return re.sub(pat, "", desc_clean).strip() 
    return desc_clean