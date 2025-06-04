import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import os

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models/spoilage_image_model.h5")
model = load_model(model_path)

def predict_spoilage_image(image_path):
    try:

        img = load_img(image_path, target_size=(224, 224))
        img_array = img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.0  # Normalize the image array

        probability = model.predict(img_array)[0][1]

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
        elif category == "Consume Soon":
            recommendation = "The food is still safe but nearing spoilage. Consume it within the next 12–24 hours and check for any off odors or appearance changes."
        elif category == "High Spoilage Risk":
            recommendation = "The food is at high risk of spoilage. Inspect it closely for signs of spoilage (e.g., smell, mold, or sliminess). If in doubt, discard it."
        else:
            recommendation = "The food is likely spoiled and unsafe to eat. Discard it immediately to avoid health risks. Do not taste or smell it."

        storage_tip = "Store perishable foods in the fridge to extend freshness. Avoid leaving food in open air for long periods."

        return {
            "category": category,
            "probability": float(round(probability, 2)),
            "recommendation": recommendation,
            "storage_tip": storage_tip
        }
    
    except Exception as e:
        print("Image prediction error:", e)
        return {"error": str(e)}