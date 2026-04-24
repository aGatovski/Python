import os
from requests import Session
from services.merchant_service import _lookup_merchant, get_categories, _save_merchant
from google import genai
from google.genai import types

_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


def categorize_transaction(description: str, db: Session) -> str:
    """Categorize a transaction description."""
    # 1. Check merchant cache first
    merchant_category = _lookup_merchant(description)

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

    response = _client.generate_content(
        model="gemini-2.5-flash-lite", 
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.2,  # deterministic output
            max_output_tokens=10,  # short response
            )
    )

    best_match = response.text.strip()
    _save_merchant(description, best_match, db) 

    return best_match


def _build_financial_context(summary: dict, by_category: list) -> str:
    """
    Build a plain-text financial context block from pre-calculated data.
    The AI model receives only this context — it never computes financial values itself.
    """
    lines = [
        f"Month: {summary.get('month')}",
        f"Total Income: {summary.get('total_income')}",
        f"Total Expenses: {summary.get('total_expenses')}",
        f"Net: {summary.get('net')}",
        f"Savings Rate: {summary.get('savings_rate')}%",
        f"Transaction Count: {summary.get('transaction_count')}",
        "",
        "Expenses by Category:",
    ]
    for item in by_category:
        lines.append(f"  - {item['category']}: {item['total']}")
    return "\n".join(lines)


def chat(message: str, financial_context: str) -> str:
    """
    Send a user message to Gemini with pre-calculated financial context.
    The model is instructed never to compute or invent financial figures.
    """
    system_prompt = (
        "You are a personal finance assistant. "
        "You have been given pre-calculated financial data below. "
        "Use ONLY this data to answer the user's question. "
        "Do NOT compute, estimate, or invent any financial figures. "
        "If the data does not contain enough information to answer, say so clearly.\n\n"
        f"Financial Data:\n{financial_context}"
    )
    response = _model.generate_content(f"{system_prompt}\n\nUser: {message}")
    return response.text


def generate_monthly_summary(financial_context: str) -> str:
    """Generate a narrative monthly summary from pre-calculated data."""
    prompt = (
        "You are a personal finance assistant. "
        "Based ONLY on the following pre-calculated financial data, write a concise monthly summary "
        "(3-5 sentences). Do NOT invent or compute any numbers.\n\n"
        f"Financial Data:\n{financial_context}"
    )
    response = _model.generate_content(prompt)
    return response.text


def get_suggestions(financial_context: str) -> str:
    """Generate spending optimization suggestions from pre-calculated data."""
    prompt = (
        "You are a personal finance assistant. "
        "Based ONLY on the following pre-calculated financial data, provide 3-5 actionable "
        "spending optimization suggestions. Do NOT invent or compute any numbers.\n\n"
        f"Financial Data:\n{financial_context}"
    )
    response = _model.generate_content(prompt)
    return response.text


def run_scenario(scenario: str, financial_context: str) -> str:
    """
    Analyse a hypothetical scenario (e.g. 'cut dining by 10%') using pre-calculated data.
    The model must not compute new totals — it should reason qualitatively.
    """
    prompt = (
        "You are a personal finance assistant. "
        "The user wants to explore the following scenario: "
        f'"{scenario}"\n\n'
        "Based ONLY on the following pre-calculated financial data, describe the likely impact "
        "of this scenario in qualitative terms. Do NOT compute new totals.\n\n"
        f"Financial Data:\n{financial_context}"
    )
    response = _model.generate_content(prompt)
    return response.text


def build_context(summary: dict, by_category: list) -> str:
    """Public helper so routers can build context without importing internals."""
    return _build_financial_context(summary, by_category)