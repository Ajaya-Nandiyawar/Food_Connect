from flask import Blueprint, request, render_template, jsonify, session
from datetime import datetime
from extensions import db, mail
from notifications import send_notification
from flask_mail import Message
from geopy.geocoders import Nominatim

ngo_blueprint = Blueprint('ngo', __name__)

class RequestModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    food_category = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    pick_up_date = db.Column(db.Date, nullable=False)
    preferred_time = db.Column(db.Time, nullable=False)
    additional_note = db.Column(db.Text, nullable=False)
    phone_number = db.Column(db.String(15), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'food_category': self.food_category,
            'quantity': self.quantity,
            'additional_note': self.additional_note,
            'pick_up_date': self.pick_up_date.strftime('%Y-%m-%d'),
            'preferred_time': self.preferred_time.strftime('%H:%M'),
            'phone_number': self.phone_number,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

@ngo_blueprint.route('/request', methods=['GET', 'POST'])
def handle_request():
    if request.method == 'GET':
        requests = RequestModel.query.order_by(RequestModel.created_at).all()
        return render_template('N-Request.html', requests=[request.to_dict() for request in requests])

    if request.content_type != "application/json":
        return jsonify({"status": "error", "message": "Content-Type must be application/json"}), 415

    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Invalid JSON data"}), 400

        # Handle request status update
        if "request_id" in data and "status" in data:
            request_id = data["request_id"]
            new_status = data["status"]
            request_entry = RequestModel.query.get(request_id)
            if not request_entry:
                return jsonify({"status": "error", "message": "Request not found"}), 404
            request_entry.status = new_status
            db.session.commit()
            return jsonify({"status": "success", "message": "Request status updated"})

        # Validate required fields 
        required_fields = ["food_category", "quantity", "pick_up_date", "preferred_time", "phone_number", "location"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400

        # Convert location name to coordinates
        geolocator = Nominatim(user_agent="foodconnect")
        location = geolocator.geocode(data["location"])
        if not location:
            return jsonify({"status": "error", "message": "Invalid location name. Try a different one!"}), 400

        # Create new request
        new_request = RequestModel(
            food_category=data["food_category"],
            quantity=float(data["quantity"]),
            pick_up_date=datetime.strptime(data["pick_up_date"], "%Y-%m-%d").date(),
            preferred_time=datetime.strptime(data["preferred_time"], "%H:%M").time(),
            phone_number=data["phone_number"],
            location=data["location"],
            latitude=location.latitude,
            longitude=location.longitude,
            additional_note=data.get("additional_note", "")
        )
        db.session.add(new_request)
        db.session.commit()

        # Generate notification
        ngo_name = session.get('name', 'Unknown NGO')  # Use logged-in user's name or default
        send_notification(
            ngo_name=ngo_name,
            food_type=data["food_category"],
            quantity=data["quantity"],
            additional_note=data.get("additional_note", "")
        )

        # Send email to the user if they exist in session
        if 'email' in session:
            user_email = session['email']
            msg = Message(
                subject="New Food Request Created",
                recipients=[user_email],
                body=f"Dear {ngo_name},\n\nYour request for {data['quantity']} kg of {data['food_category']} has been successfully created.\n\nDetails:\n- Pickup Date: {data['pick_up_date']}\n- Preferred Time: {data['preferred_time']}\n- Location: {data['location']}\n- Additional Note: {data.get('additional_note', 'None')}\n\nThank you for using FoodConnect!\n\nBest regards,\nFoodConnect Team"
            )
            mail.send(msg)

        return jsonify({
            "status": "success",
            "message": "Request submitted successfully",
            "latitude": location.latitude,
            "longitude": location.longitude,
            "location": data["location"]
        }), 201
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    
@ngo_blueprint.route('/combined_data_json', methods=['GET'])
def get_combined_data_json():
    from Restaurant import DonationModel  # Move import here to avoid circular import
    ngo_requests = RequestModel.query.order_by(RequestModel.created_at).all()
    ngo_formatted = [
        {
            "position": {"lat": req.latitude, "lng": req.longitude},
            "title": f"{req.location} Donation Request",
            "description": req.food_category,
            "quantity": f"{req.quantity} kg",
            "contact": req.phone_number,
            "type": "green"
        }
        for req in ngo_requests if req.latitude and req.longitude
    ]
    restaurant_donations = DonationModel.query.order_by(DonationModel.created_at).all()
    restaurant_formatted = [
        {
            "position": {"lat": donation.latitude, "lng": donation.longitude},
            "title": f"{donation.location} Pickup Point",
            "description": donation.food_type,
            "quantity": f"{donation.quantity} {donation.unit}",
            "contact": donation.phone,
            "type": "red"
        }
        for donation in restaurant_donations if donation.latitude and donation.longitude
    ]
    combined_data = ngo_formatted + restaurant_formatted
    return jsonify(combined_data)