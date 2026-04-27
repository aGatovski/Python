🗂️ Project Overview
BudgetApp is a full-stack personal finance management application. It allows users to track transactions, manage budgets, set financial goals, analyze spending by category, and interact with an AI-powered financial assistant. The architecture is cleanly split into a Python backend and a React/TypeScript frontend.

🛠️ Technologies & Frameworks
Backend
Layer	Technology
Language	Python 3.x
Web Framework	FastAPI
Data Validation	Pydantic (models/schemas)
AI Integration	OpenAI API (GPT-based chat assistant)
Data Persistence	CSV files (via custom csv_handler utility)
Server	Uvicorn (ASGI server)
CORS	FastAPI CORSMiddleware
Frontend
Layer	Technology
Language	TypeScript
Framework	React (functional components + hooks)
Styling	Tailwind CSS
HTTP Client	Fetch API (abstracted in /api/ layer)
Routing	React Router
State Management	Local component state (useState, useEffect)
Charts	Abstracted chart components
🏗️ Software Engineering Patterns
1. Layered Architecture (N-Tier)
The backend is strictly separated into three layers:

Routers (/routers/) — HTTP request handling, route definitions (Controller layer)
Services (/services/) — Business logic (Service layer)
Utils (/utils/) — Cross-cutting concerns like CSV I/O (Infrastructure layer)
This mirrors the classic Controller → Service → Repository pattern.

2. Repository / Data Access Pattern
The csv_handler.py utility acts as a lightweight data access layer, abstracting all file I/O operations. Services never directly touch the filesystem — they delegate to this utility.

3. Service Layer Pattern
Each domain (budgets, goals, transactions, categories, AI) has a dedicated service file (budget_service.py, goal_service.py, etc.) that encapsulates all business rules. Routers are kept thin — they only parse requests and delegate to services.

4. API Abstraction Layer (Frontend)
The frontend has a dedicated /api/ directory (aiApi.ts, budgetsApi.ts, goalsApi.ts, etc.) that wraps all HTTP calls. Pages and components never call fetch directly — they use these typed API functions. This is the Facade Pattern applied to API communication.

5. Separation of Concerns
Backend: routers ≠ services ≠ data access
Frontend: pages ≠ API calls ≠ type definitions
Types are centralized in /types/ (e.g., chat.ts) for reuse across components
6. Pydantic Schema Validation (DTO Pattern)
All incoming and outgoing data on the backend is validated through Pydantic models, acting as Data Transfer Objects (DTOs). This enforces strict typing at the API boundary.

7. Single Responsibility Principle (SOLID)
Each module has one clear job:

ai_service.py → only handles OpenAI communication
csv_handler.py → only handles CSV read/write
categories_service.py → only manages category logic
8. Component-Based UI Architecture
The frontend follows React's component model with reusable, self-contained components. Pages (AIAssistantPage.tsx, BudgetsPage.tsx) compose smaller components and manage their own local state.

9. RESTful API Design
The backend exposes a clean REST API with resource-based routing (/goals, /budgets, /analytics, /categories, /ai), standard HTTP verbs, and JSON payloads.

📁 High-Level Project Structure

BudgetApp/
├── backend/
│   ├── main.py                  # FastAPI app entry point, CORS, router registration
│   ├── models/                  # Pydantic data models (DTOs)
│   ├── routers/                 # Route handlers (thin controllers)
│   │   ├── goals.py
│   │   ├── analytics.py
│   │   ├── categories.py
│   │   └── ai.py
│   ├── services/                # Business logic
│   │   ├── budget_service.py
│   │   ├── goal_service.py
│   │   ├── transactions_service.py
│   │   ├── categories_service.py
│   │   └── ai_service.py
│   └── utils/
│       └── csv_handler.py       # Data persistence abstraction
│
└── frontend/
    └── src/
        ├── api/                 # API abstraction layer
        │   ├── aiApi.ts
        │   ├── budgetsApi.ts
        │   └── goalsApi.ts
        ├── pages/               # Full page components
        │   ├── AIAssistantPage.tsx
        │   └── BudgetsPage.tsx
        └── types/               # Shared TypeScript type definitions
            └── chat.ts
✅ Summary in One Paragraph
BudgetApp is a full-stack FinTech application built with FastAPI (Python) on the backend and React + TypeScript + Tailwind CSS on the frontend. The backend follows a strict Layered Architecture with a Service Layer pattern, Repository/Data Access abstraction via CSV, and Pydantic DTOs for type-safe API contracts. The frontend applies a Facade pattern through a dedicated API layer, component-based UI architecture, and strong TypeScript typing. The entire codebase adheres to SOLID principles, particularly Single Responsibility and Separation of Concerns, making it clean, maintainable, and ready to scale into a production application.