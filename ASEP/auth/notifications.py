from flask import Blueprint, render_template, jsonify, request, redirect, url_for
from extensions import db

notifications_bp = Blueprint("notifications", __name__)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(255), nullable=False)
    ngo_name = db.Column(db.String(100), nullable=False)
    food_type = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.String(50), nullable=False)
    additional_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())

def send_notification(ngo_name, food_type, quantity, additional_note):
    """Function to store the notification in the database."""
    new_notification = Notification(
        message=f"Food request generated",
        ngo_name=ngo_name,
        food_type=food_type,
        quantity=quantity,
        additional_note=additional_note
    )
    db.session.add(new_notification)
    db.session.commit()

@notifications_bp.route("/alerts")
def alerts():
    # Redirect to restaurant dashboard or show a static message
    return redirect(url_for('restaurant_dashboard'))

@notifications_bp.route("/notifications")
def notifications():
    # Redirect to NGO dashboard or show a static message
    return render_template("notification.html", message="Notifications are now shown in the dashboard popup.")

@notifications_bp.route("/api/notifications")
def get_notifications():
    notifications = Notification.query.order_by(Notification.created_at.desc()).limit(5).all()
    return jsonify([
        {
            "id": notif.id,
            "message": notif.message,
            "ngo_name": notif.ngo_name,
            "food_type": notif.food_type,
            "quantity": notif.quantity,
            "additional_note": notif.additional_note,
            "created_at": notif.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for notif in notifications
    ])

@notifications_bp.route("/api/notifications/delete/<int:notification_id>", methods=["POST"])
def delete_notification(notification_id):
    """Delete a specific notification by ID."""
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({"status": "error", "message": "Notification not found"}), 404
    
    try:
        db.session.delete(notification)
        db.session.commit()
        return jsonify({"status": "success", "message": "Notification deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500