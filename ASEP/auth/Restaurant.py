from flask import Blueprint, request, render_template, jsonify, session
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from extensions import db, mail, NGO
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from notifications import send_notification
from flask_mail import Message
import cloudinary.uploader
from threading import Timer
from flask import current_app as app
from flask import current_app



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
    image_url = db.Column(db.String(255), nullable=True)

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
            'phone': self.phone,
            'image_url': self.image_url
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
        return render_template('R-Donations.html', donations=donations)
    
    if request.method == 'POST':
        try:
            # Handle form data instead of JSON for file uploads
            food_type = request.form.get('food_type')
            quantity = request.form.get('quantity')
            unit = request.form.get('unit')
            expiry_date = request.form.get('expiry_date')
            pickup_time = request.form.get('pickup_time')
            special_instructions = request.form.get('special_instructions', '')
            location = request.form.get('location')
            phone = request.form.get('phone')

            required_fields = ['food_type', 'quantity', 'unit', 'expiry_date', 'pickup_time', 'location', 'phone']
            for field in required_fields:
                if not request.form.get(field):
                    return jsonify({'status': 'error', 'message': f'Missing required field: {field}'}), 400

            if not (phone.isdigit() and len(phone) == 10):
                return jsonify({'status': 'error', 'message': 'Phone number must be exactly 10 digits'}), 400

            try:
                location_data = geolocator.geocode(location, timeout=10)
                if not location_data:
                    return jsonify({'status': 'error', 'message': 'Invalid location'}), 400
                latitude = location_data.latitude
                longitude = location_data.longitude
            except GeocoderTimedOut:
                return jsonify({'status': 'error', 'message': 'Geocoding timed out'}), 503

            # Handle image upload
            image_url = None
            if 'food_image' in request.files:
                food_image = request.files['food_image']
                if food_image.filename != '':
                    upload_result = cloudinary.uploader.upload(food_image, folder="food_donations")
                    image_url = upload_result['secure_url']

            new_donation = DonationModel(
                food_type=food_type,
                quantity=float(quantity),
                unit=unit,
                expiry_date=datetime.strptime(expiry_date, '%Y-%m-%dT%H:%M'),
                pickup_time=datetime.strptime(pickup_time, '%H:%M').time(),
                special_instructions=special_instructions,
                location=location,
                latitude=latitude,
                longitude=longitude,
                phone=phone,
                image_url=image_url  # Save the image URL
            )
            db.session.add(new_donation)
            db.session.commit()

            def warn_before_expiry(donation_id):
                with app.app_context():
                    donation = DonationModel.query.get(donation_id)
                    if donation and donation.status == 'Pending':
                        send_notification(
                            ngo_name="System",
                            food_type="Expiring Donation",
                            quantity=f"Donation ID {donation_id}",
                            additional_note="This donation request will be removed in 1 hour. If you need it, accept it soon to prevent waste."
                        )

                        ngos = NGO.query.all()
                        if ngos:
                            ngo_emails = [ngo.email for ngo in ngos]
                            msg = Message(
                                subject="Donation Will Expire in 1 Hour",
                                recipients=ngo_emails,
                                body=f"Donation ID {donation_id} will be automatically removed in 1 hour.\n\nAct quickly if this donation is needed.\n\nFoodConnect Team"
                            )
                            mail.send(msg)

            def delete_expired_donation(app, donation_id):
                with app.app_context():
                    donation = DonationModel.query.get(donation_id)
                    if donation and donation.status == 'Pending':
                        db.session.delete(donation)
                        db.session.commit()

                        send_notification(
                            ngo_name="System",
                            food_type="Donation Expired",
                            quantity=f"Donation ID {donation_id} auto-deleted.",
                            additional_note="It wasn't accepted within 3 hours and has been removed to avoid spoilage."
                        )

                        ngos = NGO.query.all()
                        if ngos:
                            ngo_emails = [ngo.email for ngo in ngos]
                            msg = Message(
                                subject="Donation Expired",
                                recipients=ngo_emails,
                                body=f"Name:{restaurant_name}\n\nDonation ID {donation_id} was removed from the system after 3 hours to avoid spoilage.\n\nFoodConnect Team"
                            )
                            mail.send(msg)

            Timer(7200, warn_before_expiry, args=[new_donation.id]).start()    # Warn after 2 hours
            Timer(10800, delete_expired_donation, args=[current_app._get_current_object(), new_donation.id]).start()    

            restaurant_name = session.get('name', 'Unknown Restaurant')
            send_notification(
                ngo_name=restaurant_name,
                food_type=food_type,
                quantity=f"{quantity} {unit}",
                additional_note=special_instructions
            )

            ngos = NGO.query.all()
            if ngos:
                ngo_emails = [ngo.email for ngo in ngos]
                msg = Message(
                    subject="New Donation Available",
                    recipients=ngo_emails,
                    body=f"A new donation has been created by {restaurant_name}.\n\nDetails:\n- Food Type: {food_type}\n- Quantity: {quantity} {unit}\n- Expiry Date: {expiry_date}\n- Pickup Time: {pickup_time}\n- Location: {location}\n- Special Instructions: {special_instructions or 'None'}\n- Image: {image_url or 'Not provided'}\n\nPlease log in to FoodConnect to review and respond.\n\nBest regards,\nFoodConnect Team"
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
    donation = DonationModel.query.get(donation_id)
    if not donation:
        return jsonify({"status": "error", "message": "Donation not found"}), 404

    if donation.status != "Pending":
        return jsonify({"status": "error", "message": "Can only edit pending donations"}), 400

    try:
        if 'multipart/form-data' in request.content_type:
            donation.food_type = request.form.get("food_type", donation.food_type)
            donation.quantity = float(request.form.get("quantity", donation.quantity))
            donation.unit = request.form.get("unit", donation.unit)
            donation.expiry_date = datetime.strptime(
                request.form.get("expiry_date", donation.expiry_date.strftime('%Y-%m-%dT%H:%M')),
                '%Y-%m-%dT%H:%M'
            )
            donation.pickup_time = datetime.strptime(
                request.form.get("pickup_time", donation.pickup_time.strftime('%H:%M')),
                '%H:%M'
            ).time()
            donation.special_instructions = request.form.get("special_instructions", donation.special_instructions)
            donation.location = request.form.get("location", donation.location)
            donation.phone = request.form.get("phone", donation.phone)

            if 'food_image' in request.files and request.files['food_image'].filename != '':
                upload_result = cloudinary.uploader.upload(request.files['food_image'], folder="food_donations")
                donation.image_url = upload_result['secure_url']
        else:
            return jsonify({"status": "error", "message": "Content-Type must be multipart/form-data"}), 415

        if donation.location != DonationModel.query.get(donation_id).location:
            try:
                location_data = geolocator.geocode(donation.location, timeout=10)
                if not location_data:
                    return jsonify({"status": "error", "message": "Invalid location"}), 400
                donation.latitude = location_data.latitude
                donation.longitude = location_data.longitude
            except GeocoderTimedOut:
                return jsonify({"status": "error", "message": "Geocoding timed out"}), 503

        if donation.phone and not (donation.phone.isdigit() and len(donation.phone) == 10):
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