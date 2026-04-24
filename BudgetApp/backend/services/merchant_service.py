from requests import Session
from typing import Optional
from models.merchant_data import MerchantData

#{merchant_name: category_name}
_merchant_cache : dict[str, str] = {}

async def load_merchant_cache(db: Session) -> None:
    """Load merchant-category mappings into in-memory cache."""
    global _merchant_cache
    merchants = db.query(MerchantData).all()

    for merchant in merchants:
        _merchant_cache[merchant.merchant_name.lower()] = merchant.category
        print(f"Loaded merchant '{merchant.merchant_name}' with category '{merchant.category}' into cache")


def _lookup_merchant(merchant_name: str) -> Optional[str]:
    """Lookup a merchant name in the cache and return its category if found."""
    normalized_name = merchant_name.lower().strip()
    return _merchant_cache.get(normalized_name)


def _save_merchant(merchant_name: str, category: str, db: Session) -> None:
    normalized_name = merchant_name.lower().strip()
    merchant = MerchantData(merchant_name=normalized_name, category=category)
    
    # Update DB
    existing = db.query(MerchantData).filter(MerchantData.merchant_name == normalized_name).first()

    if not existing:
        db.add(merchant)
        db.commit()
    
    # Update cache
    _merchant_cache[normalized_name] = category
    print(f"Saved merchant '{normalized_name}' with category '{category}' to DB and cache")


def update_merchant_category(merchant_name: str, category: str, db: Session) -> None:
    """Update the category for a merchant in both DB and cache."""
    normalized_name = merchant_name.lower().strip()

    #Update DB
    existing = db.query(MerchantData).filter(MerchantData.merchant_name == normalized_name).first()

    if existing:
        existing.category = category
    else:
        existing = MerchantData(merchant_name=normalized_name, category=category)
        db.add(existing)
    db.commit() 

    # Update cache
    _merchant_cache[normalized_name] = category
    print(f"Updated merchant '{normalized_name}' with category '{category}' in DB and cache")


def get_categories() -> tuple[str]:
    """Return a list of unique categories from the merchant cache."""
    return tuple(set(_merchant_cache.values()))