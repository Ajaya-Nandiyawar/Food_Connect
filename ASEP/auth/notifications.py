from flask import Blueprint, render_template, jsonify
from extensions import db  # Import common database instance

# Define the blueprint
notifications_bp = Blueprint("notifications", __name__)

# Define the Notification model
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(255), nullable=False)
    ngo_name = db.Column(db.String(100), nullable=False)
    food_type = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.String(50), nullable=False)
    additional_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())

# Function to send notifications
def send_notification( food_type, quantity, additional_note):
    """Function to store the notification in the database."""
    new_notification = Notification(
        message=f"Food request generated",
        food_type=food_type,
        quantity=quantity,
        additional_note=additional_note
    )
    db.session.add(new_notification)
    db.session.commit()

# Route to fetch notifications (for alert.html)
@notifications_bp.route("/alerts")
def alerts():
    notifications = Notification.query.order_by(Notification.created_at.desc()).all()
    return render_template("alert.html", notifications=notifications)

# API endpoint for real-time fetching (for JavaScript popup notifications)
@notifications_bp.route("/api/notifications")
def get_notifications():
    notifications = Notification.query.order_by(Notification.created_at.desc()).limit(5).all()
    return jsonify([
        {
            "message": notif.message,
            "food_type": notif.food_type,
            "quantity": notif.quantity,
            "additional_note": notif.additional_note,
            "created_at": notif.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for notif in notifications
    ])
