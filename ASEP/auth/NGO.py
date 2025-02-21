from flask import Blueprint, request, render_template, jsonify
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from extensions import db
  # Initialize SQLAlchemy

ngo_blueprint = Blueprint('ngo', __name__)

class RequestModel(db.Model):  # Request model
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
            'pick_up_date': self.pick_up_date.strftime('%Y-%m-%d'),
            'preferred_time': self.preferred_time.strftime('%H:%M'),
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

@ngo_blueprint.route('/request', methods=['GET', 'POST'])
def handle_request():
    if request.method == 'POST':
        try:
            data = request.get_json()  # Accept JSON input

            # If it's a status update request
            if "request_id" in data and "status" in data:
                request_id = data["request_id"]
                new_status = data["status"]

                request_entry = RequestModel.query.get(request_id)
                if not request_entry:
                    return jsonify({'status': 'error', 'message': 'Request not found'}), 404

                request_entry.status = new_status
                db.session.commit()
                return jsonify({'status': 'success', 'message': 'Request status updated'})

            # If it's a new request submission
            food_category = data['food_category']
            quantity = float(data['quantity'])
            pick_up_date = datetime.strptime(data['pick_up_date'], '%Y-%m-%d').date()
            preferred_time = datetime.strptime(data['preferred_time'], '%H:%M').time()
            additional_note = data['additional_note']

            new_request = RequestModel(
                food_category=food_category,
                quantity=quantity,
                pick_up_date=pick_up_date,
                preferred_time=preferred_time,
                additional_note=additional_note
            )
            db.session.add(new_request)
            db.session.commit()

            return jsonify({'status': 'success'})

        except Exception as e:
            print(f"Error: {str(e)}")
            return jsonify({'status': 'error', 'message': str(e)}), 400

    # Fetch all requests for GET requests
    requests = RequestModel.query.order_by(RequestModel.created_at).all()
    return render_template('request.html', requests=[request.to_dict() for request in requests])
