import csv
import io
from datetime import date
from typing import List

from services.ai_service import categorize_transaction
from fastapi import HTTPException, UploadFile


# date , amount ,cat , description 
async def parse_transactions_csv(file: UploadFile) -> List[dict]:
    """
    Parse an uploaded CSV file into a list of transaction dicts.
    Minimum required columns: amount, description, date.
    Optional columns: category, is_fixed.
    """
    content = await file.read()
    content_str = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(content_str))

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
            date_str = row[date_col].strip()
            amount = float(row[amount_col].strip())
            description = row[description_col].strip()
            category = categorize_transaction(description)
            transactions.append(
                {
                    "date": date_str,
                    "amount": amount,
                    "category": category,
                    "description": description,
                }
            )
        except (ValueError, KeyError) as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data on CSV row {i}: {exc}",
            )
    print (f"Parsed {len(transactions)} transactions from CSV")
    print (transactions)
    #return transactions


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
