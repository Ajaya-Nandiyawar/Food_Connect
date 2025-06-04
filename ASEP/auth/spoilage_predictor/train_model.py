# spoilage_predictor/train_model.py
# This script trains a machine learning model to predict food spoilage based on various features.
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the absolute path to the CSV file
csv_path = os.path.join(script_dir, "food_spoilage_data.csv")

# Load the dataset from CSV with error handling
try:
    data = pd.read_csv(csv_path)
except FileNotFoundError as e:
    print(f"Error: Could not find the CSV file at {csv_path}. Please ensure 'food_spoilage_data.csv' is in the same directory as this script.")
    raise e

# Encode categorical variables
label_encoders = {}
for col in ['food_type', 'storage_type']:
    le = LabelEncoder()
    data[col] = le.fit_transform(data[col])
    label_encoders[col] = le

X = data.drop('spoiled', axis=1)
y = data['spoiled']

# Train model with tuned parameters to prevent overfitting
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=50, max_depth=5, min_samples_split=5, random_state=42)
model.fit(X_train, y_train)

# Save model and encoders
os.makedirs("models", exist_ok=True)
joblib.dump(model, "models/spoilage_model.pkl")
joblib.dump(label_encoders, "models/label_encoders.pkl")

print("Model and encoders saved!")