
from fastapi import UploadFile
import pandas as pd
import io
from datetime import date
from typing import List
from services.classifier_service import clean_description, extract_merchant
from models.transaction import Transaction
from sqlalchemy.orm import Session
from services.transactions_service import categorize_transaction

REQUIRED_COLUMNS_REVOLUT = {
    "Type",
    "Started Date",
    "Amount",
    "Description"
}

async def parse_transactions_csv(imported_file: UploadFile, user_id: int, db: Session) -> List[Transaction]:
    """
    Parse an uploaded CSV file into a list of Transaction.
    """
    try:
        contents = await imported_file.read()
        df = pd.read_csv(io.BytesIO(contents), encoding="utf-8-sig")

    except UnicodeDecodeError:
        raise ValueError("File encoding not supported. Save the CSV as UTF-8 and try again.")
    
    except Exception as e:
        raise ValueError(f"Cound not read file: {str(e)}")
    
    missing = [col for col in REQUIRED_COLUMNS_REVOLUT if col not in df.columns]
    
    if missing:
        raise ValueError(f"CSV is missing required columns: {missing}")
    
    transactions = []
    for i, row in df.iterrows():
        try:
            tx_type = row["Type"]
            tx_date = row["Started Date"]
            desc_clean = clean_description(text=row["Description"])
            amount = row["Amount"]
            merchant = extract_merchant(desc_clean=desc_clean)
            category, src = categorize_transaction(tx_type=tx_type, amount=amount, description=desc_clean, merchant=merchant)

            tx = Transaction(user_id=user_id, type=tx_type, date=tx_date, amount=amount, 
                            description=desc_clean, merchant=merchant, category=category, category_src=src)
        
            transactions.append(tx)
            db.add(tx)

        except Exception as e:
            raise ValueError(f"Error on row {i+1}: {str(e)}")
        
    return transactions
    

# Not touched
def export_transactions_csv(transactions: List[dict]) -> str:
    """Serialize a list of transaction dicts to a CSV string."""
    output = io.StringIO()
    fieldnames = [
        "id",
        "date",
        "amount",
        "category",
        "description",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(transactions)
    return output.getvalue()
