from flask import Blueprint, request, render_template, jsonify, session
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from extensions import db
from notifications import send_notification

  # Initialize SQLAlchemy

ngo_blueprint = Blueprint('ngo', __name__)

class RequestModel(db.Model):  
    id = db.Column(db.Integer, primary_key=True)
    food_category = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    pick_up_date = db.Column(db.Date, nullable=False)
    preferred_time = db.Column(db.Time, nullable=False)
    additional_note = db.Column(db.Text, nullable=False)
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
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }



@ngo_blueprint.route('/request', methods=['GET', 'POST'])
def handle_request():
    if request.method == 'POST':
        try:
            data = request.get_json()
            if "request_id" in data and "status" in data:
                request_id = data["request_id"]
                new_status = data["status"]

                request_entry = RequestModel.query.get(request_id)
                if not request_entry:
                    return jsonify({'status': 'error', 'message': 'Request not found'}), 404

                request_entry.status = new_status
                db.session.commit()
                return jsonify({'status': 'success', 'message': 'Request status updated'})


            # Create new food request
            new_request = RequestModel(
                food_category=data['food_category'],
                quantity=float(data['quantity']),
                pick_up_date=datetime.strptime(data['pick_up_date'], '%Y-%m-%d').date(),
                preferred_time=datetime.strptime(data['preferred_time'], '%H:%M').time(),
                additional_note=data['additional_note']
            )
            db.session.add(new_request)
            db.session.commit()

            # Send a notification
            notification_message = f"New food request from {data['food_category']} ({data['quantity']} kg). Note: {data['additional_note']}"
            send_notification(notification_message)  # Call function to add notification

            return jsonify({'status': 'success'})

        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 400

    requests = RequestModel.query.order_by(RequestModel.created_at).all()
    return render_template('request.html', requests=[request.to_dict() for request in requests])