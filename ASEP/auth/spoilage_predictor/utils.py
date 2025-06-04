# spoilage_predictor/utils.py
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from reportlab.lib.utils import ImageReader
import os

def format_latex_report(food_type, temperature, humidity, storage_type, hours, result):
    """
    Format the prediction result as a LaTeX document string.
    
    Args:
        food_type (str): Type of food
        temperature (float): Temperature in °C
        humidity (float): Humidity in %
        storage_type (str): Storage type (fridge, open_air)
        hours (float): Hours since preparation
        result (dict): Prediction result with category, probability, recommendation, storage_tip
    
    Returns:
        str: LaTeX document content
    """
    color = "green" if result["category"] == "Safe to Eat" else "red" if result["category"] == "Unsafe – Discard Immediately" else "orange"
    return f"""
\\documentclass{{article}}
\\usepackage{{geometry}}
\\geometry{{a4paper, margin=1in}}
\\usepackage{{xcolor}}
\\usepackage{{titling}}
\\begin{{document}}
\\title{{Food Spoilage Report}}
\\author{{}}
\\date{{{result['date']}}}
\\maketitle
\\section*{{Prediction Details}}
\\textbf{{Food Type:}} {food_type}\\\\
\\textbf{{Temperature:}} {temperature} °C\\\\
\\textbf{{Humidity:}} {humidity} %\\\\
\\textbf{{Storage Type:}} {storage_type}\\\\
\\textbf{{Hours Since Preparation:}} {hours}\\\\
\\section*{{Result}}
\\textbf{{Category:}} \\textcolor{{{color}}}{{{result['category']}}}\\\\
\\textbf{{Spoilage Probability:}} {result['probability'] * 100}%\\\\
\\textbf{{Recommendation:}} {result['recommendation']}\\\\
\\textbf{{Storage Tip:}} {result['storage_tip']}\\\\
\\end{{document}}
"""

def generate_spoilage_report_pdf(prediction):
    """
    Generate a PDF report for food spoilage prediction with a logo watermark.

    Args:
        prediction (dict): Dictionary containing prediction details with keys:
            - date (str)
            - food_type (str)
            - temperature (str)
            - humidity (str)
            - storage_type (str)
            - hours (str)
            - category (str)
            - probability (str)
            - recommendation (str)
            - storage_tip (str)

    Returns:
        BytesIO: Buffer containing the generated PDF.
    """
    # Dynamically get the directory of this file
    base_dir = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.join(base_dir, '..', 'static', 'img', 'logo_png.png')
    logo_path = os.path.normpath(logo_path)

    # Create a PDF using reportlab
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Define page dimensions (letter size: 612 x 792 points)
    page_width, page_height = letter

    # Add the logo as a watermark
    p.saveState()
    logo = ImageReader(logo_path)
    logo_width = 300  # Adjust the width of the logo
    logo_height = 300  # Adjust the height of the logo

    # Set transparency for the logo
    p.setFillAlpha(0.3)  # Adjust the alpha value (0.0 to 1.0) for fading effect

    p.drawImage(logo, (page_width - logo_width) / 2, (page_height - logo_height) / 2,
                width=logo_width, height=logo_height, mask='auto')
    p.restoreState()

    # Add "FoodConnect" Branding at the Top Left
    p.setFont("Helvetica-Bold", 16)
    p.setFillColorRGB(0, 0, 0)  # Black color
    title = "FoodConnect - Food Spoilage Report"
    text_width = p.stringWidth(title, "Helvetica-Bold", 16)
    p.drawString((page_width - text_width) / 2, 770, title)

    # Add "Food Spoilage Report" title below the branding
    p.setFont("Helvetica", 12)
    p.drawString(50, 750, "Food Spoilage Report")

    # Draw the report content
    y = 730  # Adjusted starting y position to avoid overlap with branding
    p.setFont("Helvetica", 10)

    p.drawString(100, y, f"Date: {prediction.get('date', 'N/A')}")
    y -= 20

    p.drawString(100, y, "Prediction Details")
    y -= 15
    p.drawString(100, y, f"Food Type: {prediction.get('food_type', 'N/A')}")
    y -= 15
    p.drawString(100, y, f"Temperature: {prediction.get('temperature', 'N/A')} °C")
    y -= 15
    p.drawString(100, y, f"Humidity: {prediction.get('humidity', 'N/A')} %")
    y -= 15
    p.drawString(100, y, f"Storage Type: {prediction.get('storage_type', 'N/A')}")
    y -= 15
    p.drawString(100, y, f"Hours Since Preparation: {prediction.get('hours', 'N/A')}")
    y -= 20

    p.drawString(100, y, "Result")
    y -= 15
    p.drawString(100, y, f"Category: {prediction.get('category', 'N/A')}")
    y -= 15
    p.drawString(100, y, f"Spoilage Probability: {prediction.get('probability', 'N/A')}%")
    y -= 15

    # Handle recommendation (wrap text if too long)
    recommendation = prediction.get('recommendation', 'N/A')
    text = p.beginText(100, y)
    text.setFont("Helvetica", 10)
    for line in recommendation.split('\n'):
        text.textLine(line)
        y -= 15
    p.drawText(text)

    y -= 10
    storage_tip = prediction.get('storage_tip', 'N/A')
    text = p.beginText(100, y)
    text.setFont("Helvetica", 10)
    for line in storage_tip.split('\n'):
        text.textLine(line)
        y -= 15
    p.drawText(text)

    p.showPage()
    p.save()

    buffer.seek(0)
    return buffer