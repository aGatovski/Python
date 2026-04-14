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

    DATE_PATTERN = re.compile(r"^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")
    AMOUNT_PATTERN = re.compile(r'^-?\d+(\.\d+)?$')

    def __init__(self,date: str, description: str,amount: str,category=None):
        if not self.DATE_PATTERN.match(date):
            raise ValueError(f"Invalid date format: {date}. Expected YYYY-MM-DD.")
        self.date = date

        if not self.AMOUNT_PATTERN.match(amount):
            raise ValueError(f"Invalid amount: {amount}. Expected a positive number or a negative number prefixed with -.")
        self.amount = amount

        self.description = description
        if category is not None:
            self.category = self.getCategory(category)
        else:
            self.category = self.getCategory(self.description)

    def __str__(self):
        return (f"Transaction details: Date: {self.date} Category: {self.category} Description: {self.description} Amount: {self.amount}")
    
    def getCategory(self, description):
        if description.lower() in self.TRANSACTION_CATEGORIES:
            return description.lower()

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
