from flask import Blueprint, request, render_template, jsonify, session
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from extensions import db, mail, NGO
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from notifications import send_notification
from flask_mail import Message



restaurant_blueprint = Blueprint('restaurant', __name__)

geolocator = Nominatim(user_agent="foodconnect_app")

class DonationModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    food_type = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    expiry_date = db.Column(db.DateTime, nullable=False)
    pickup_time = db.Column(db.Time, nullable=False)
    special_instructions = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    location = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    phone = db.Column(db.String(10), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'food_type': self.food_type,
            'quantity': self.quantity,
            'unit': self.unit,
            'expiry_date': self.expiry_date.strftime('%Y-%m-%d %H:%M'),
            'pickup_time': self.pickup_time.strftime('%H:%M'),
            'special_instructions': self.special_instructions,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'phone': self.phone
        }

@restaurant_blueprint.route('/donations_json', methods=['GET'])
def get_donations_json():
    donations = DonationModel.query.order_by(DonationModel.created_at).all()
    formatted_donations = [
        {
            "position": {"lat": donation.latitude, "lng": donation.longitude},
            "title": f"{donation.location} Pickup Point",
            "description": donation.food_type,
            "quantity": f"{donation.quantity} {donation.unit}",
            "type": "red"
        }
        for donation in donations if donation.latitude and donation.longitude
    ]
    return jsonify(formatted_donations)

@restaurant_blueprint.route('/donation', methods=['GET', 'POST'])
def handle_donation():
    if request.method == 'GET' and request.headers.get('Accept') == 'application/json':
        donations = DonationModel.query.all()
        return jsonify({
            'status': 'success',
            'donations': [donation.to_dict() for donation in donations]
        })
    elif request.method == 'GET':
        donations = DonationModel.query.all()
        return render_template('donationManagement.html', donations=donations)
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'status': 'error', 'message': 'Invalid JSON data'}), 400

            required_fields = ['food_type', 'quantity', 'unit', 'expiry_date', 'pickup_time', 'location', 'phone']
            for field in required_fields:
                if field not in data:
                    return jsonify({'status': 'error', 'message': f'Missing required field: {field}'}), 400

            phone = data['phone']
            if not (phone.isdigit() and len(phone) == 10):
                return jsonify({'status': 'error', 'message': 'Phone number must be exactly 10 digits'}), 400

            try:
                location_data = geolocator.geocode(data['location'], timeout=10)
                if not location_data:
                    return jsonify({'status': 'error', 'message': 'Invalid location'}), 400
                latitude = location_data.latitude
                longitude = location_data.longitude
            except GeocoderTimedOut:
                return jsonify({'status': 'error', 'message': 'Geocoding timed out'}), 503

            new_donation = DonationModel(
                food_type=data['food_type'],
                quantity=float(data['quantity']),
                unit=data['unit'],
                expiry_date=datetime.strptime(data['expiry_date'], '%Y-%m-%dT%H:%M'),
                pickup_time=datetime.strptime(data['pickup_time'], '%H:%M').time(),
                special_instructions=data.get('special_instructions', ''),
                location=data['location'],
                latitude=latitude,
                longitude=longitude,
                phone=phone
            )
            db.session.add(new_donation)
            db.session.commit()

            restaurant_name = session.get('name', 'Unknown Restaurant')
            send_notification(
                ngo_name=restaurant_name,
                food_type=data['food_type'],
                quantity=f"{data['quantity']} {data['unit']}",
                additional_note=data.get('special_instructions', '')
            )

            ngos = NGO.query.all()
            if ngos:
                ngo_emails = [ngo.email for ngo in ngos]
                msg = Message(
                    subject="New Donation Available",
                    recipients=ngo_emails,
                    body=f"A new donation has been created by {restaurant_name}.\n\nDetails:\n- Food Type: {data['food_type']}\n- Quantity: {data['quantity']} {data['unit']}\n- Expiry Date: {data['expiry_date']}\n- Pickup Time: {data['pickup_time']}\n- Location: {data['location']}\n- Special Instructions: {data.get('special_instructions', 'None')}\n\nPlease log in to FoodConnect to review and respond.\n\nBest regards,\nFoodConnect Team"
                )
                mail.send(msg)

            return jsonify({
                'status': 'success',
                'message': 'Donation created successfully',
                'donation': new_donation.to_dict()
            })

        except ValueError as ve:
            return jsonify({'status': 'error', 'message': 'Invalid date format'}), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)}), 500
        
        

@restaurant_blueprint.route('/donation/<int:donation_id>', methods=['PUT'])
def update_donation(donation_id):
    if request.content_type != "application/json":
        return jsonify({"status": "error", "message": "Content-Type must be application/json"}), 415

    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Invalid JSON data"}), 400

    donation = DonationModel.query.get(donation_id)
    if not donation:
        return jsonify({"status": "error", "message": "Donation not found"}), 404

    if donation.status != "Pending":
        return jsonify({"status": "error", "message": "Can only edit pending donations"}), 400

    try:
        # Update fields if provided
        donation.food_type = data.get("food_type", donation.food_type)
        donation.quantity = float(data.get("quantity", donation.quantity))
        donation.unit = data.get("unit", donation.unit)
        donation.expiry_date = datetime.strptime(data.get("expiry_date", donation.expiry_date.strftime('%Y-%m-%dT%H:%M')), '%Y-%m-%dT%H:%M')
        donation.pickup_time = datetime.strptime(data.get("pickup_time", donation.pickup_time.strftime('%H:%M')), '%H:%M').time()
        donation.special_instructions = data.get("special_instructions", donation.special_instructions)
        donation.location = data.get("location", donation.location)
        donation.phone = data.get("phone", donation.phone)

        # Re-geocode location if it changed
        if "location" in data and data["location"] != donation.location:
            try:
                location_data = geolocator.geocode(data["location"], timeout=10)
                if not location_data:
                    return jsonify({"status": "error", "message": "Invalid location"}), 400
                donation.latitude = location_data.latitude
                donation.longitude = location_data.longitude
            except GeocoderTimedOut:
                return jsonify({"status": "error", "message": "Geocoding timed out"}), 503

        # Validate phone if provided
        if "phone" in data:
            if not (data["phone"].isdigit() and len(data["phone"]) == 10):
                return jsonify({"status": "error", "message": "Phone number must be exactly 10 digits"}), 400

        db.session.commit()
        return jsonify({"status": "success", "message": "Donation updated successfully", "donation": donation.to_dict()}), 200

    except ValueError as ve:
        return jsonify({"status": "error", "message": "Invalid date format"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@restaurant_blueprint.route('/donation/<int:donation_id>/cancel', methods=['POST'])
def cancel_donation(donation_id):
    if request.content_type != "application/json":
        return jsonify({"status": "error", "message": "Content-Type must be application/json"}), 415

    donation = DonationModel.query.get(donation_id)
    if not donation:
        return jsonify({"status": "error", "message": "Donation not found"}), 404

    if donation.status != "Pending":
        return jsonify({"status": "error", "message": "Can only cancel pending donations"}), 400

    donation.status = "Cancelled"
    db.session.commit()
    return jsonify({"status": "success", "message": "Donation cancelled successfully", "donation": donation.to_dict()}), 200        