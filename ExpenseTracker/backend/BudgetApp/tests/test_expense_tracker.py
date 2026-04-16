import pytest
from unittest.mock import patch, MagicMock, mock_open
from expense_tracker.expense_tracker import get_user_input
from expense_tracker.expense_tracker import get_single_transaction
from expense_tracker.expense_tracker import *

def test_get_user_input_end(monkeypatch):
    # Simulate the user typing "end" immediately
    monkeypatch.setattr("builtins.input", lambda _: "end")
    get_user_input("fake_path.csv")  # should return without error

def test_get_user_input_invalid_then_end(monkeypatch, capsys):
    responses = iter(["xyz","end"])
    monkeypatch.setattr("builtins.input", lambda _: next(responses))

    get_user_input("fake_path.csv")

    captured = capsys.readouterr()
    assert "Invalid input" in captured.out


def test_get_user_input_file(monkeypatch):
    responses = iter(["file","end"])
    monkeypatch.setattr("builtins.input", lambda _: next(responses))

    mock_transactions_list = [MagicMock()]

    with patch("expense_tracker.expense_tracker.get_file_transactions",return_value=mock_transactions_list) as mock_get_file_transactions, \
         patch("expense_tracker.expense_tracker.store_input") as mock_store:

        get_user_input("fake_path.csv")

        mock_get_file_transactions.assert_called_once()
        mock_store.assert_called_once_with(mock_transactions_list, "fake_path.csv")

def test_get_user_input_transaction(monkeypatch):
    responses = iter(["transaction","end"])
    monkeypatch.setattr("builtins.input", lambda _: next(responses))

    mock_transaction = MagicMock()

    with patch("expense_tracker.expense_tracker.get_single_transaction",return_value=mock_transaction) as mock_get_single_transaction, \
         patch("expense_tracker.expense_tracker.store_input") as mock_store:

        get_user_input("fake_path.csv")

        mock_get_single_transaction.assert_called_once()
        mock_store.assert_called_once_with(mock_transaction, "fake_path.csv")

def test_get_single_transaction_valid_transaction(monkeypatch):
    test_category = "Groceries"
    responses = iter(["2026-12-12",25,"1"])
    monkeypatch.setattr("builtins.input", lambda _: next(responses))

    t = get_single_transaction()

    assert(t.date == "2026-12-12")
    assert(t.amount == 25)
    assert(t.description == test_category)
    assert(t.category == test_category)

def test_get_single_transaction_invalid_date(monkeypatch, capsys):
    responses = iter(["202-21-12", "2026-12-12", "-25.0", "1"])
    monkeypatch.setattr("builtins.input", lambda _: next(responses))

    t = get_single_transaction()

    captured = capsys.readouterr()
    assert "Invalid date" in captured.out
    
def test_get_single_transaction_invalid_amount(monkeypatch, capsys):
    responses = iter(["2026-12-12", "a", "-25.0", "1"])
    monkeypatch.setattr("builtins.input", lambda _: next(responses))

    t = get_single_transaction()

    captured = capsys.readouterr()
    assert "Invalid amount" in captured.out

def test_get_single_transaction_invalid_amount(monkeypatch, capsys):
    responses = iter(["2026-12-12",-25.0, "173","1"])
    monkeypatch.setattr("builtins.input", lambda _: next(responses))

    t = get_single_transaction()

    captured = capsys.readouterr()
    assert "Invalid category" in captured.out

def test_get_file_transactions_valid(monkeypatch):
    mock_csv = "date,description,amount\n2026-01-01,Lidl,-25.0\n"
    monkeypatch.setattr("builtins.input", lambda _: "fake_file.csv")

    with patch("expense_tracker.expense_tracker.Path.exists", return_value=True), \
         patch("builtins.open", mock_open(read_data=mock_csv)):
         
        result = get_file_transactions()

    assert len(result) == 1
    assert result[0].date == "2026-01-01"
    assert result[0].amount == -25.0
    assert result[0].category == "Groceries"

def test_get_file_transactions_invalid_file(monkeypatch, capsys):
    mock_csv = "date,description,amount\n2026-01-01,Lidl,-25.0\n"

    responses = iter([mock_csv,"invalid_file.csv"])
    monkeypatch.setattr("builtins.input", lambda _: next(responses))

    exists_responses = iter([False, True])
    with patch("expense_tracker.expense_tracker.Path.exists", side_effect = exists_responses), \
         patch("builtins.open", mock_open(read_data=mock_csv)):

        result = get_file_transactions()
        
    captured = capsys.readouterr()
    assert "File does not exist" in captured.out 
    assert len(result) == 1     

