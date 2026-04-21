# Goal: Predict house prices from house size
# Key question: Does the model work well on houses it has never seen before?


from sklearn.model_selection import train_test_split
import numpy as np

# Features (X) and labels (y)
X = np.array([50, 60, 70, 80, 90, 100, 110, 120]).reshape(-1, 1)
y = np.array([100000, 120000, 140000, 160000, 180000, 200000, 220000, 240000])

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42
)


from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)

train_predictions = model.predict(X_train)

test_predictions = model.predict(X_test)


from sklearn.metrics import mean_squared_error

train_error = mean_squared_error(y_train, train_predictions)
test_error = mean_squared_error(y_test, test_predictions)

print(train_error)
print(test_error)
