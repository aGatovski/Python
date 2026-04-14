from transaction import Transaction
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
import csv



def main():
    TRANSACTION_FILE = "TRANSACTION_FILE.csv"
    get_user_input(TRANSACTION_FILE)
    summerize_expenses(TRANSACTION_FILE)

def get_user_input(transaction_file_path):
    while True:
        expense_type =  input("What info are you providing? File or 1 Transaction?")
        if expense_type.strip().lower() == "file":
            print("User wants to provide a file")
            user_transactions = get_file_transactions()
            store_input(user_transactions, transaction_file_path)
        elif expense_type.strip().lower() == "transaction":
            print("User wants to provide a single transaction")
            user_transaction = get_single_transaction()
            store_input(user_transaction, transaction_file_path)
        else:
            print("Invalid input. Please try again!")
            break
        
def get_single_transaction():
    while True:
        transaction_date = input("When was this transaction executed? Please provide a date in format YYYY-MM-DD: ")
        if not Transaction.DATE_PATTERN.match(transaction_date):
            print("Invalid date. Please try again!")
        else:
            break

    while True:
        transaction_amount = input("Provide the amount of the transaction (positive number or negative with -): ")
        if not Transaction.AMOUNT_PATTERN.match(transaction_amount):
            print("Invalid date. Please try again!")
        else:
            break

    while True:
        print("Select a category: ")
        for i, category_name in enumerate(Transaction.TRANSACTION_CATEGORIES):
            print(f"{i + 1}. {category_name}")

        value_range = f"[1 - {len(Transaction.TRANSACTION_CATEGORIES)}]"
        selected_idx = int(input(f"Enter a category number {value_range}: ")) - 1

        if selected_idx in range(len(Transaction.TRANSACTION_CATEGORIES)):
            return Transaction( date=transaction_date, description=Transaction.TRANSACTION_CATEGORIES[selected_idx], amount= transaction_amount)
        else:
            print("Invalid category. Please try again!")

def get_file_transactions():
    while True:
        file_name = input("File path: ")
        file_path = Path(__file__).parent / file_name

        if file_path.exists():
            print("File exists")
            transactions_list = []
            with open(file_path,'r') as file:
                reader = csv.DictReader(file)
                date_col = next(col for col in reader.fieldnames if "date" in col.lower())
                desc_col = next(col for col in reader.fieldnames if "description" in col.lower())
                amount_col = next(col for col in reader.fieldnames if "amount" in col.lower())
                for row in reader:
                    date_str = pd.to_datetime(row[date_col]).strftime("%Y-%m-%d")
                    transaction = Transaction(date=date_str,
                                              description=row[desc_col],
                                              amount=str(row[amount_col]).strip())
                    transactions_list.append(transaction)
            return transactions_list
        else:
            print("File does not exist. Try again!")

def store_input(transactions, transaction_file_path):
    if isinstance(transactions,Transaction):
        transactions = [transactions]

    with open(transaction_file_path,'a') as file:
        for transaction in transactions:
            file.write(f"{transaction.date},{transaction.category},{transaction.description},{transaction.amount}\n")

def summerize_expenses(transaction_file_path):
    df = pd.read_csv(transaction_file_path,header=None,names=["date","category","description","amount"])
    
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")

    # Only include expenses (negative amounts)
    df_expenses = df[df["amount"] < 0].copy()
    df_expenses["abs_amount"] = df_expenses["amount"].abs()

    category_totals = df_expenses.groupby("category")["abs_amount"].sum().sort_values(ascending=False)

    print(df.describe())
    
    print("\n=== Expense Summary by Category ===")
    print(category_totals.to_string())
    print(f"\nTotal spent: {category_totals.sum():.2f}")

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

    # Pie chart
    ax1.pie(category_totals, labels=category_totals.index, autopct="%1.1f%%", startangle=140)
    ax1.set_title("Spending by Category (Pie)")

    # Bar chart
    category_totals.plot(kind="bar", ax=ax2, color="steelblue", edgecolor="black")
    ax2.set_title("Spending by Category (Bar)")
    ax2.set_xlabel("Category")
    ax2.set_ylabel("Total Amount")
    ax2.tick_params(axis="x", rotation=45)

    plt.tight_layout()
    plt.show()
    """
    list_tr = []
    with open(transaction_file_path,'r') as file:
        lines = file.readlines()
        for line in lines:
            transaction_date,transaction_category,transaction_desc,transcation_amount = line.strip().split(',')
            line_transaction = Transaction(transaction_date,transaction_desc,transcation_amount,transaction_category)
            print(line_transaction)
            list_tr.append(line_transaction)
"""

# only through when we run this file
if __name__ == "__main__":  
    main() 