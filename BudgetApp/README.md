# 💸 BudgetApp

An AI-powered personal finance backend built with FastAPI, PostgreSQL, and Gemini. Features a self-improving ML transaction classifier, an agentic chat assistant with function-calling, and a RAG-style financial context engine.

---

## ✨ Key Features

### 🤖 Two-Tier Intelligent Transaction Classifier
Transactions are categorised automatically through a two-stage pipeline:
1. **Sentence-embedding model** (`all-MiniLM-L6-v2`) converts merchant descriptions into vector representations, fed into a **logistic regression classifier** for high-confidence predictions
2. **LLM fallback (Gemini)** handles low-confidence cases — and those outputs are written back to the merchant database, continuously retraining the classifier over time (self-improving loop)

### 🧠 Agentic Chat Assistant
A conversational financial assistant powered by **Gemini function-calling**. The model can autonomously execute real actions — like creating budgets — directly from natural language, not just describe them.

### 📊 RAG-Style Financial Context Engine
Each chat session builds a structured context block from deterministic, pre-computed data: current month summary, spending by category, budget status, savings goals, and a 3-month spending trend. The LLM is grounded entirely in this data — it never invents figures.

### 📁 CSV Import with Auto-Categorisation
Users can bulk-import transaction histories (e.g. from Revolut or DSK Bank). Each row is automatically categorised by the ML pipeline on import, with duplicate detection to prevent re-imports.

### 📈 Analytics & Budget Tracking
- Monthly summaries: income, expenses, net savings, savings rate
- Spending breakdown by category (filterable by month/year)
- Budget status per category: spent, remaining, % used
- Savings goal forecasting with projected completion dates

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.x |
| Web Framework | FastAPI |
| Database | PostgreSQL (via SQLAlchemy ORM) |
| Schema Validation | Pydantic v2 |
| AI / LLM | Google Gemini API (`gemini-2.5-flash`) |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| Classifier | Scikit-learn Logistic Regression |
| Auth | JWT (access + refresh tokens via `python-jose`) |
| Server | Uvicorn (ASGI) |

---

## 🏗️ Architecture

```
BudgetApp/
├── main.py                   # App entry point, lifespan, CORS, router registration
├── routers/                  # Thin HTTP controllers (one per domain)
│   ├── transactions.py
│   ├── budgets.py
│   ├── goals.py
│   ├── categories.py
│   ├── analytics.py
│   ├── ai.py
│   └── auth.py
├── services/                 # All business logic
│   ├── transactions_service.py   # ML classifier + LLM fallback
│   ├── ai_service.py             # Gemini chat, context builder, tool definitions
│   ├── analytics_service.py      # Aggregation queries
│   ├── budget_service.py         # Budget status calculations
│   ├── goal_service.py           # Goal forecasting
│   ├── merchant_service.py       # Merchant cache + DB
│   └── categories_service.py
├── models/                   # SQLAlchemy ORM models
├── schemas/                  # Pydantic DTOs (request/response validation)
├── utils/
│   ├── auth.py               # JWT creation, hashing, current_user dependency
│   └── csv_handler.py        # CSV import pipeline
├── config.py                 # Pydantic settings (env vars)
└── database.py               # Engine, session, Base
```

The backend follows a strict **Controller → Service** layered architecture. Routers are kept thin — they handle HTTP and delegate everything else to services. All API boundaries are validated through Pydantic DTOs.

---

## 🔄 ML Pipeline — How It Works

```
CSV Import / Manual Transaction
          │
          ▼
  Merchant Description
          │
          ▼
  Sentence Embedding (MiniLM)
          │
          ▼
  Logistic Regression Classifier
          │
    ┌─────┴─────┐
confidence > 0.5?
    │           │
   YES          NO
    │           │
    ▼           ▼
 Category    Gemini LLM
 returned    (fallback)
                │
                ▼
       Save to merchant DB
       (retrains classifier
        on next startup)
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL running locally
- Google Gemini API key

### Setup

```bash
git clone https://github.com/aGatovski/BudgetApp
cd BudgetApp

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/budgetapp
GOOGLE_API_KEY=your_gemini_api_key
SECRET_KEY=your_jwt_secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Run the server:

```bash
uvicorn main:app --reload
```

API docs available at `http://localhost:8000/docs`

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login, receive JWT tokens |
| `GET` | `/api/transactions` | List transactions (filterable) |
| `POST` | `/api/transactions/import` | Bulk import CSV with auto-categorisation |
| `GET` | `/api/analytics/overview` | Full dashboard: summary + budgets + categories |
| `GET` | `/api/budgets/status` | Budget status for current month |
| `GET` | `/api/ai/chat/init` | Build session financial context (call once) |
| `POST` | `/api/ai/chat` | Send message with conversation history |

---

## 🔮 Roadmap

- [ ] Add classifier accuracy metrics + evaluation script
- [ ] Frontend (React + TypeScript)
- [ ] Goal contribution tracking
- [ ] Multi-currency support
- [ ] Docker + deployment config
