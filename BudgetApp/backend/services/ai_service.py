import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from services.merchant_service import _lookup_merchant, get_categories, _save_merchant
from services.analytics_service import get_monthly_summary, get_expenses_by_category
from services.budget_service import calculate_budget_status
from services.goal_service import goal_summary
from google import genai
from google.genai import types
from models.user import User
from datetime import date
from dateutil.relativedelta import relativedelta

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

def _build_financial_context(user_id: int, db: Session) -> str:
    """
    Build a plain-text financial context block from pre-calculated data.
    The AI model receives only this context — it never computes financial values itself.
    """
    today = date.today()
    current_month = f"{today.year}-{today.month:02d}"

    monthly_summary = get_monthly_summary(db=db, user_id=user_id, month=current_month)
    speding_by_category = get_expenses_by_category(db=db, user_id=user_id, month=current_month)
    budgets = calculate_budget_status(db=db, user_id=user_id, month=current_month)
    goals =  goal_summary(db=db, user_id=user_id)
    
    lines = [
        "=== FINANCIAL ASSISTANT CONTEXT ===",
        f"Generated: {current_month}",
        "",
        f"--- Current Month ({current_month}) ---",
        f"Total Income: {monthly_summary['total_income']}EUR",
        f"Total Expenses: {monthly_summary['total_expenses']}EUR",
        f"Net Savings: {monthly_summary['net']}EUR",
        f"Savings Rate: {monthly_summary['savings_rate']}",
        "",
        "--- SPENDING BY CATEGORY ---",
        ]
    
    for item in speding_by_category:
        lines.append(f"{item['category']}: {item['total']}EUR")
    
    lines.append("")
    lines.append(f"--- ACTIVE BUDGETS {current_month}---")
    for budget in budgets:
        lines.append(f"For {budget['category']}: spent {budget['spent']} of {budget['limit']}"
                     f"Percentage used: {budget['percent_used']}")
    
    lines.append("")
    lines.append("--- SAVINGS GOALS ---")
    for goal in goals:
        lines.append(f"For {goal['name']}: {goal['current_amount']} of {goal['target_amount']}"
                     f"Deadline: {goal['deadline']}")

    lines.append("")
    lines.append("--- SPENDING TREND (last 3 months) ---")
    for offset in range(3, 0, -1):
        target_month = today - relativedelta(months=offset)
        target_month_str =  f"{target_month.year}-{target_month.month:02d}"
        target_month_summary = get_monthly_summary(db, user_id, target_month_str)

        lines.append(f"Month: {target_month}: {target_month_summary['total_expenses']} expenses")

    #print(lines)
    return "\n".join(lines)

def chat_with_history(message: str, history: list[dict], session_context: str) -> str:
    """
    Send a message to Gemini with full conversation history.
    
    Args:
        message: The latest user message
        history: List of previous messages [{"role": "user"|"model", "content": "..."}]
        session_context: The financial context string built at session start (loaded once)
    
    Returns:
        The AI's response text
    """
    system_instruction = (
        "You are a personal financial assistant with access to the user's complete financial data. "
        "Use ONLY the data provided in your context to answer questions. "
        "Do NOT compute, estimate, or invent any financial figures — all numbers are pre-calculated. "
        "If the data does not contain enough information to answer, say so clearly. "
        "Be concise, specific, and actionable. When suggesting improvements, reference actual numbers from the data.\n\n"
        f"FINANCIAL DATA:\n{session_context}"
    )

    # Build Gemini's multi-turn contents array from history
    # Gemini uses "model" (not "assistant") for AI turns
    contents = []
    for msg in history:
        contents.append({
            "role": msg["role"],  # "user" or "model"
            "parts": [{"text": msg["content"]}]
        })

    # Append the new user message
    contents.append({
        "role": "user",
        "parts": [{"text": message}]
    })

    response = _client.models.generate_content(
        model=_CHAT_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.4,
            max_output_tokens=1024
        ) 
    )

    return response.text.strip()

async def chat(message: str, financial_context: str) -> str:
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

    response = _client.models.generate_content(model="gemini-2.0-flash", contents=f"{system_prompt}\n\nUser: {message}")
    return response.text


def generate_monthly_summary(financial_context: str) -> str:
    """Generate a narrative monthly summary from pre-calculated data."""
    prompt = (
        "You are a personal finance assistant. "
        "Based ONLY on the following pre-calculated financial data, write a concise monthly summary "
        "(3-5 sentences). Do NOT invent or compute any numbers.\n\n"
        f"Financial Data:\n{financial_context}"
    )
    response = _client.models.generate_content(model="gemini-2.0-flash", contents=prompt)

    return response.text


def get_suggestions(financial_context: str) -> str:
    """Generate spending optimization suggestions from pre-calculated data."""
    prompt = (
        "You are a personal finance assistant. "
        "Based ONLY on the following pre-calculated financial data, provide 3-5 actionable "
        "spending optimization suggestions. Do NOT invent or compute any numbers.\n\n"
        f"Financial Data:\n{financial_context}"
    )
    response = _client.models.generate_content(model="gemini-2.0-flash", contents=prompt)

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
    response = _client.models.generate_content(model="gemini-2.0-flash", contents=prompt)

    return response.text


# def build_context(summary: dict, by_category: list) -> str:
#     """Public helper so routers can build context without importing internals."""
#     return _build_financial_context(summary, by_category)