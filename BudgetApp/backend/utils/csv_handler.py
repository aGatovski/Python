
from fastapi import UploadFile
import pandas as pd
import io
from typing import List

REQUIRED_COLUMNS_REVOLUT = {
    "Type",
    "Started Date",
    "Amount",
    "Description"
}

async def parse_transactions_csv(imported_file: UploadFile) -> List[dict]:
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

    return df.to_dict(orient="records")
    

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
