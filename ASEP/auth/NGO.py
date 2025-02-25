from flask import Blueprint, request, render_template, jsonify, session
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from extensions import db
from notifications import send_notification
from geopy.geocoders import Nominatim  # Import geopy for location conversion

# Initialize SQLAlchemy
ngo_blueprint = Blueprint('ngo', __name__)

class RequestModel(db.Model):  
    id = db.Column(db.Integer, primary_key=True)
    food_category = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    pick_up_date = db.Column(db.Date, nullable=False)
    preferred_time = db.Column(db.Time, nullable=False)
    additional_note = db.Column(db.Text, nullable=False)
    phone_number = db.Column(db.String(15), nullable=False)  # New field
    location = db.Column(db.String(255), nullable=False)  # New field
    latitude = db.Column(db.Float, nullable=False)  # New field for latitude
    longitude = db.Column(db.Float, nullable=False) # New field for longitude
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
            'phone_number': self.phone_number,  # Include in response
            'location': self.location,  # Include in response
            'latitude': self.latitude,  # Include latitude
            'longitude': self.longitude, # Include longitude
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

@ngo_blueprint.route('/request', methods=['GET', 'POST'])
def handle_request():
    if request.method == 'GET':
        # Fetch all requests from the database
        requests = RequestModel.query.order_by(RequestModel.created_at).all()
        return render_template('request.html', requests=[request.to_dict() for request in requests])

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

        # Handle new request creation
        new_request = RequestModel(
            food_category=data["food_category"],
            quantity=float(data["quantity"]),
            pick_up_date=datetime.strptime(data["pick_up_date"], "%Y-%m-%d").date(),
            preferred_time=datetime.strptime(data["preferred_time"], "%H:%M").time(),
            phone_number=data["phone_number"],
            location=data["location"],
            latitude=location.latitude,  # Store latitude
            longitude=location.longitude, # Store longitude
            additional_note=data.get("additional_note", "")
        )
        db.session.add(new_request)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Request submitted successfully",
            "latitude": location.latitude,
            "longitude": location.longitude,
            "location": data["location"]
        }), 201
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    
@ngo_blueprint.route('/requests_json', methods=['GET'])
def get_requests_json():
    requests = RequestModel.query.order_by(RequestModel.created_at).all()
    formatted_requests = [
        {
            "position": {"lat": req.latitude, "lng": req.longitude},
            "title": f"{req.location} Donation Request",
            "description": req.food_category,
            "quantity": f"{req.quantity} kg",
            "type": "green"  # NGO requests are delivery points
        }
        for req in requests
    ]
    return jsonify(formatted_requests)