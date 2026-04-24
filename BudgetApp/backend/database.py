from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from services.merchant_service import load_merchant_cache
from config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ONE TIME: Load cache when app starts
_cache_session = SessionLocal()
try:
    load_merchant_cache(_cache_session)  # Load for the whole app
finally:
    _cache_session.close()

class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()