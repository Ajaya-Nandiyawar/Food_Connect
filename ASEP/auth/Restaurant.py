from flask import Blueprint, request, render_template, jsonify
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from extensions import db
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

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
    location = db.Column(db.String(255), nullable=False)  # New field for location
    latitude = db.Column(db.Float, nullable=True)  # Store latitude
    longitude = db.Column(db.Float, nullable=True)  # Store longitude
    phone = db.Column(db.String(10), nullable=True)  # 10-digit phone number

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
            "type": "red"  # Restaurant donations are pickup points
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

            # Validate phone number (10 digits)
            phone = data['phone']
            if not (phone.isdigit() and len(phone) == 10):
                return jsonify({'status': 'error', 'message': 'Phone number must be exactly 10 digits'}), 400

            # Geocode location to lat/long
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
