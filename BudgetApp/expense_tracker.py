from transaction import Transaction

def main():
    # get user to input
    # transform it into our trans
    #
    # store it in file
    # add callable functionallities for tracking stuff
    # by reading the file
    get_user_input()
    store_input()
    summerize_expenses()
    pass

def get_user_input():
    while True:
        expense_type =  input("What info are you providing? File or 1 Transaction?")
        if expense_type.strip().lower() == "file":
            print("User wants to provide a file")
            # file exist? if not error
            # open file if not error
            # get content store in transaction
            # add to local file
            break
        elif expense_type.strip().lower() == "transaction":
            print("User wants to provide a single transaction")
            user_transaction = get_single_transaction()
            print(user_transaction)
            # get user input if not error
            # store in trans
            # add to local file
            break
        else:
            print("Invalid input. Please try again!")
        
def get_single_transaction():
    transaction_date = input("When was this transaction executed? Please provide a date in format YYYY-MM-DD ")
    transaction_amount = input("Amount: ")

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

def store_input():
    print("get input")
    pass

def summerize_expenses():
    print("get input")
    pass

# only through when we run this file
if __name__ == "__main__":  
    main() 