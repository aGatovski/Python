import pytest
from expense_tracker.transaction import Transaction

def test_valid_transaction_creation():
    t = Transaction("2026-03-15",description="Lidl",amount=-25.50)
    assert(t.date == "2026-03-15")
    assert(t.description == "Lidl")
    assert(t.amount == -25.50)

def test_invalid_date_format_raises():
    with pytest.raises(ValueError):
        Transaction("10-03-2015",description="Lidl",amount=-25.50)

def test_invalid_date_month_raises():
    with pytest.raises(ValueError):
        Transaction("2026-13-15",description="Lidl",amount=-25.50)

def test_invalid_date_day_raises():
    with pytest.raises(ValueError):
        Transaction("2026-03-35",description="Lidl",amount=-25.50)

def test_explicit_category_overrides_description():
    t = Transaction("2026-03-15",description="Lidl",amount=-25.50,category="Sport")
    assert(t.category == "Sport")