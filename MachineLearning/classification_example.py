from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression

emails = [
    "Win money now",
    "Limited time free offer",
    "Hello, how are you?",
    "Let's meet tomorrow",
    "Earn cash fast"
]

labels = [1, 1, 0, 0, 1]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(emails)

model = LogisticRegression()
model.fit(X, labels)

new_email = ["Free money waiting for you"]
new_email_vector = vectorizer.transform(new_email)

prediction = model.predict(new_email_vector)

if prediction[0] == 1:
    print("Spam")
else:
    print("Not Spam")