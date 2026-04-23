from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    analytics,
    auth,
    budgets,
    categories,
    goals,
    income,
    transactions,
    users,
)
from routers import ai
app = FastAPI(
    title="BudgetApp API",
    description="Personal budgeting and financial coaching API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(income.router, prefix="/api/income", tags=["Income"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(goals.router, prefix="/api/goals", tags=["Goals"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "BudgetApp API is running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
