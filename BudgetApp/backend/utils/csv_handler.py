import csv
import io
from datetime import date
from typing import List

from fastapi import HTTPException, UploadFile


REQUIRED_CSV_FIELDS = {"amount", "description", "date"}
USER_CATEGORIES = {
    "Food",
    "Bank Loan",
    "Subscribtion",
    "Car",
    "Gas",
    "Dorm",
    "Grocieries",
}


def parse_transactions_csv(file: UploadFile) -> List[dict]:
    """
    Parse an uploaded CSV file into a list of transaction dicts.
    Minimum required columns: amount, description, date.
    Optional columns: category, is_fixed.
    """
    content = file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))

    if reader.fieldnames is None:
        raise HTTPException(
            status_code=400, detail="CSV file is empty or has no headers"
        )

    date_col = next(col for col in reader.fieldnames if "date" in col.lower())
    description_col = next(
        col for col in reader.fieldnames if "description" in col.lower()
    )
    amount_col = next(col for col in reader.fieldnames if "amount" in col.lower())

    transactions = []
    for i, row in enumerate(reader, start=2):  # row 1 = header
        try:
            # basically you get random csv file without header
            # and find amount desc and first occurance of date
            # then from description you ask a model to decide a category based on predetermined categories
            amount = float(row[amount_col].strip())
            description = row[description_col].strip()
            date = row[date_col].strftime("%Y-%m-%d")
    
            category = row.get("category", "Uncategorized").strip() or "Uncategorized"
            is_fixed_raw = row.get("is_fixed", "false").strip().lower()
            is_fixed = is_fixed_raw in ("true", "1", "yes")

            transactions.append(
                {
                    "date": parsed_date,
                    "amount": amount,
                    "category": category,
                    "description": description,
                    "is_fixed": is_fixed,
                    "is_recurring": False,
                }
            )
        except (ValueError, KeyError) as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data on CSV row {i}: {exc}",
            )

    return transactions


def export_transactions_csv(transactions: List[dict]) -> str:
    """Serialize a list of transaction dicts to a CSV string."""
    output = io.StringIO()
    fieldnames = [
        "id",
        "date",
        "amount",
        "category",
        "description",
        "is_fixed",
        "is_recurring",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(transactions)
    return output.getvalue()
