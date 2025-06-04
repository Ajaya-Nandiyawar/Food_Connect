# spoilage_predictor/predict.py
import joblib
import numpy as np

# Load model and encoders once
model = joblib.load("models/spoilage_model.pkl")
encoders = joblib.load("models/label_encoders.pkl")

def predict_spoilage(input_data):
    try:

        input_data['food_type'] = input_data['food_type'].lower()
        input_data['storage_type'] = input_data['storage_type'].lower()


        # Encode categorical fields
        food_type_enc = encoders['food_type'].transform([input_data['food_type']])[0]
        storage_type_enc = encoders['storage_type'].transform([input_data['storage_type']])[0]

        features = np.array([[food_type_enc,
                              input_data['temperature'],
                              input_data['humidity'],
                              storage_type_enc,
                              input_data['time_since_preparation']]])

        probability = model.predict_proba(features)[0][1]

        if probability < 0.25:
            category = "Safe to Eat"
        elif probability < 0.5:
            category = "Consume soon"
        elif probability < 0.75:
            category = "High Spoilage Risk"
        else:
            category = "Unsafe - Discard Immediately"
        
        if category == "Safe to Eat":
            recommendation = "The food appears safe to eat. However, always check for unusual smells, textures, or colors before consuming."
        elif category == "Consume soon":
            recommendation = "The food is still safe but nearing spoilage. However, Consume it within the next 12–24 hours and check for any off odors or appearance changes."
        elif category == "High Spoilage Risk":
            recommendation = "The food is at high risk of spoilage. Inspect it closely for signs of spoilage (e.g., smell, mold, or sliminess). If in doubt, discard it."
        else:
            recommendation = "The food is likely spoiled and unsafe to eat. Discard it immediately to avoid health risks. Do not taste or smell it."

        storage_type = input_data['storage_type']
        food_type = input_data['food_type']
        if storage_type == "fridge":
            storage_tip = f"Fridge storage slows spoilage, but {food_type} should still be consumed within recommended timeframes (e.g., cooked rice within 24 hours, meat within 1–2 days)."
        else:  # open_air
            storage_tip = f"Open air storage accelerates spoilage, especially for perishable items like {food_type}. Consider transferring to a fridge to extend freshness."

        return {
            "category": category,
            "probability": round(probability, 2),
            "recommendation": recommendation,
            "storage_tip": storage_tip
        }

    except Exception as e:
        print("Prediction error:", e)
        return {"error": str(e)}
