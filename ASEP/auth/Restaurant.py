from flask import Blueprint, request, render_template, jsonify
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from extensions import db

restaurant_blueprint = Blueprint('restaurant', __name__)

class DonationModel(db.Model):  # Donation model
    id = db.Column(db.Integer, primary_key=True)
    food_type = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    expiry_date = db.Column(db.DateTime, nullable=False)
    pickup_time = db.Column(db.Time, nullable=False)
    special_instructions = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

@restaurant_blueprint.route('/donation', methods=['GET', 'POST'])
def handle_donation():
    if request.method == 'GET' and request.headers.get('Accept') == 'application/json':
        donations = DonationModel.query.all()
        return jsonify({
            'status': 'success',
            'donations': [donation.to_dict() for donation in donations]
        })
    elif request.method == 'GET':  # Render template for normal requests
        donations = DonationModel.query.all()
        return render_template('donationManagement.html', donations=donations)
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'status': 'error', 'message': 'Invalid JSON data'}), 400

            required_fields = ['food_type', 'quantity', 'unit', 'expiry_date', 'pickup_time']
            for field in required_fields:
                if field not in data:
                    return jsonify({'status': 'error', 'message': f'Missing required field: {field}'}), 400

            new_donation = DonationModel(
                food_type=data['food_type'],
                quantity=float(data['quantity']),
                unit=data['unit'],
                expiry_date=datetime.strptime(data['expiry_date'], '%Y-%m-%dT%H:%M'),
                pickup_time=datetime.strptime(data['pickup_time'], '%H:%M').time(),
                special_instructions=data.get('special_instructions', '')
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

