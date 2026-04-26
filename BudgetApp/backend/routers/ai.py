from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date

from database import get_db
from models.user import User
from utils.auth import get_current_user
from services import analytics_service, ai_service

router = APIRouter()


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str       # "user" or "model"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []       # full conversation history from frontend
    session_context: str                  # financial context loaded once at session start


class ScenarioRequest(BaseModel):
    scenario: str


# ─────────────────────────────────────────────
# SESSION INIT — called ONCE when chat opens
# ─────────────────────────────────────────────

@router.get("/chat/init")
def chat_init(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Load all user financial data and return a session context string.
    The frontend stores this and sends it with every chat message.
    Called ONCE per chat session — not per message.
    """
    session_context = ai_service._build_financial_context(
        user_id=current_user.id, db=db
    )
    return {"session_context": session_context}


# ─────────────────────────────────────────────
# MULTI-TURN CHAT — called for every message
# No DB calls here — all data is in session_context from /chat/init
# ─────────────────────────────────────────────

@router.post("/chat")
def ai_chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to the AI with full conversation history.
    No DB calls — all financial data is in session_context from /chat/init.
    """
    history = [{"role": m.role, "content": m.content} for m in payload.history]
    response = ai_service.chat_with_history(
        message=payload.message,
        history=history,
        session_context=payload.session_context,
    )
    return {"response": response}


# ─────────────────────────────────────────────
# SINGLE-SHOT ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/summary/{month}")
def ai_monthly_summary(
    month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = ai_service._build_financial_context(user_id=current_user.id, db=db)
    summary_text = ai_service.generate_monthly_summary(context)
    return {"month": month, "summary": summary_text}


@router.get("/suggestions")
def ai_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = ai_service._build_financial_context(user_id=current_user.id, db=db)
    suggestions = ai_service.get_suggestions(context)
    return {"suggestions": suggestions}


@router.post("/scenario")
def ai_scenario(
    payload: ScenarioRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = ai_service._build_financial_context(user_id=current_user.id, db=db)
    analysis = ai_service.run_scenario(payload.scenario, context)
    return {"scenario": payload.scenario, "analysis": analysis}