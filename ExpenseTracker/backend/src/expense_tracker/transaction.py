import re

class Transaction:
    TRANSACTION_CATEGORIES = [
        "Groceries",
        "Gas",
        "Transport",
        "Entertainment",
        "Sport",
        "Other"
    ]

    TRANSACTION_CATEGORIES_LOWER = [c.lower() for c in TRANSACTION_CATEGORIES]
    DATE_PATTERN = re.compile(r"^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")

    def __init__(self, date: str, description: str, amount: float, category=None):
        if not self.DATE_PATTERN.match(date):
            raise ValueError(f"Invalid date format: {date}. Expected YYYY-MM-DD.")
        self.date = date

        self.amount = amount
        self.description = description
        
        if category is not None:
            self.category = self.getCategory(category)
        else:
            self.category = self.getCategory(self.description)

    def __str__(self):
        return (f"Transaction details: Date: {self.date} Category: {self.category} Description: {self.description} Amount: {self.amount}")
    
    @staticmethod
    def getCategory(description):
        if description.lower() in Transaction.TRANSACTION_CATEGORIES_LOWER:
            # return the properly-cased version
            idx = Transaction.TRANSACTION_CATEGORIES_LOWER.index(description.lower())
            return Transaction.TRANSACTION_CATEGORIES[idx]

        desc = description.lower()
        match desc:
            case "groceries" | "lidl" | "kaufland" | "billa" | "fantastico" | "food zone eood" | "32 market food" | "best market limited":
                category = "Groceries"
            case "gas" | "lukoil" | "lukoil bulgaria":
                category = "Gas"
            case "transport" | "bolt":
                category = "Transport"
            case "entertainment" | "cine grand ring mall":
                category = "Entertainment"
            case "sport" | "athletics-bg":
                category = "Sport"
            case _:
                category = "Other"
        return category
