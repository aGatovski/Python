import re
header = ["Type", "Product", "Started Date", "Completed Date", "Description", "Amount", "Fee", "Currency", "State", "Balance"]

#dict
transaction = {
    "date": "2026-01-19",          # parsed from Started Date
    "category": "Groceries",        # derived/user-assigned from Description logic to assign
    "description": "Lidl",          # merchant or counterparty name
    "amount": -12.19,               # negative = expense, positive = income
}
# Groceries [ Lidl, Fantastiko, Kaufland]
# Dining out 
# Eat at work
# Random snack
# Rent
# Subscirptions
# Loan
# Car maintainance
# Car Gas
# others


class Transaction:
    DATE_PATTERN = re.compile(r"^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")
    
    def __init__(self,date: str,description: str,amount: str):
        if not self.DATE_PATTERN.match(date):
            raise ValueError(f"Invalid date format: {date}. Expected YYYY-MM-DD.")
        self.date = date
        self.category = self.getCategory(description)
        self.description = description
        self.amount = amount

    def __str__(self):
        return (f"Transaction details: Date:{self.date} Category:{self.category} Description:{self.description} Amount:{self.amount}")
    
    def getCategory(self, description):
        desc = description.lower()
        match desc:
            case "lidl" | "kaufland" | "billa" | "fantastico" | "food zone eood" | "32 market food" | "best market limited":
                category = "Groceries"
            case "lukoil" | "lukoil bulgaria":
                category = "Gas"
            case "bolt":
                category = "Transport"
            case "cine grand ring mall":
                category = "Entertainment"
            case "athletics-bg":
                category = "Sport"
            case _:
                category = "Other"
        return category

            
tr = Transaction("2026-01-31","Lidl",30,)
print(tr)