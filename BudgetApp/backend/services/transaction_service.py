from database import SessionLocal
from models.transaction import Transaction
from services.classifier_service import clean_description, extract_merchant, categorize_transaction


async def process_import(rows: list[dict], user_id: int):
    db = SessionLocal()
    try:
        for row in rows:
            try:
                tx_type = row["Type"]
                tx_date = row["Started Date"]
                desc_clean = clean_description(text=row["Description"])
                amount = row["Amount"]
                merchant = extract_merchant(desc_clean=desc_clean)
                category, src = await categorize_transaction(tx_type=tx_type, amount=amount, description=desc_clean, merchant=merchant)

                existing = (
                    db.query(Transaction)
                    .filter(
                        Transaction.user_id == user_id,
                        Transaction.type == tx_type,
                        Transaction.date == tx_date,
                        Transaction.amount == amount,
                        Transaction.description == desc_clean,
                    )
                    .first()
                )

                if existing:
                    # Skip duplicate transaction
                    continue

                tx = Transaction(user_id=user_id, type=tx_type, date=tx_date, amount=amount, 
                                 description=desc_clean, merchant=merchant, category=category, category_src=src)
                   
                db.add(tx)

            except Exception as e:
                raise ValueError(f"Error while processing csv: {str(e)}")
        
        db.commit()

    finally:
        db.close()