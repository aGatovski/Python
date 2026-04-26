from fastapi import APIRouter, Depends, Query
from services import analytics_service
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date

from database import get_db
from models.user import User
from utils.auth import get_current_user
from services import ai_service
from google import genai
from fastapi.responses import StreamingResponse

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    context_month: Optional[str] = None


class ScenarioRequest(BaseModel):
    scenario: str
    context_month: Optional[str] = None


def _get_context(db: Session, user_id: int, month: Optional[str]) -> str:
    today = date.today()
    target_month = month or f"{today.year}-{today.month:02d}"
    summary = analytics_service.get_monthly_summary(db, user_id, target_month)
    by_cat = analytics_service.get_expenses_by_category(db, user_id, month=target_month)
    return ai_service.build_context(summary, by_cat)


@router.post("/chat")
def ai_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = _get_context(db, current_user.id, payload.context_month)
    response = ai_service.chat(payload.message, context)
    return {"response": response}


@router.get("/summary/{month}")
def ai_monthly_summary(
    month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = _get_context(db, current_user.id, month)
    summary_text = ai_service.generate_monthly_summary(context)
    return {"month": month, "summary": summary_text}


@router.get("/suggestions")
def ai_suggestions(
    month: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = _get_context(db, current_user.id, month)
    suggestions = ai_service.get_suggestions(context)
    return {"suggestions": suggestions}


@router.post("/scenario")
def ai_scenario(
    payload: ScenarioRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = _get_context(db, current_user.id, payload.context_month)
    analysis = ai_service.run_scenario(payload.scenario, context)
    return {"scenario": payload.scenario, "analysis": analysis}