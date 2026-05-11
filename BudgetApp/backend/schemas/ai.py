from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str       # "user" or "model"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []       # full conversation history from frontend
    session_context: str                  # financial context loaded once at session start


class ScenarioRequest(BaseModel):
    scenario: str