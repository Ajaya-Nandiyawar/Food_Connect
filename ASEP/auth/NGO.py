from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template
from extensions import db
from datetime import datetime
from flask_mail import Message
from geopy.geocoders import Nominatim
from extensions import mail
from notifications import send_notification  # Assuming this function is defined in notifications.py
import logging
from sqlalchemy import and_, or_

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

ngo_blueprint = Blueprint('ngo', __name__)

class EventModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    focus_area = db.Column(db.String(100), nullable=False)
    volunteers_needed = db.Column(db.Integer, nullable=False)
    event_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    phone_number = db.Column(db.String(15), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Active')  # Active, Completed, Cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'focus_area': self.focus_area,
            'volunteers_needed': self.volunteers_needed,
            'event_date': self.event_date.strftime('%Y-%m-%d'),
            'start_time': self.start_time.strftime('%H:%M:%S'),
            'end_time': self.end_time.strftime('%H:%M:%S'),
            'location': self.location,
            'phone_number': self.phone_number,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

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
    logger.debug(f"Handling request with session: {session.get('user_id', 'No user_id')}")
    if request.method == 'GET':
        requests = RequestModel.query.order_by(RequestModel.created_at).all()
        return render_template('N-Request.html', requests=[request.to_dict() for request in requests])

    if request.content_type != "application/json":
        return jsonify({"status": "error", "message": "Content-Type must be application/json"}), 415

    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Invalid JSON data"}), 400

        if "request_id" in data and "status" in data:
            request_id = data["request_id"]
            new_status = data["status"]
            request_entry = RequestModel.query.get(request_id)
            if not request_entry:
                return jsonify({"status": "error", "message": "Request not found"}), 404
            request_entry.status = new_status
            db.session.commit()
            return jsonify({"status": "success", "message": "Request status updated"})

        required_fields = ["food_category", "quantity", "pick_up_date", "preferred_time", "phone_number", "location"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400

        geolocator = Nominatim(user_agent="foodconnect")
        location = geolocator.geocode(data["location"])
        if not location:
            return jsonify({"status": "error", "message": "Invalid location name. Try a different one!"}), 400

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

        ngo_name = session.get('name', 'Unknown NGO')
        send_notification(
            ngo_name=ngo_name,
            food_type=data["food_category"],
            quantity=data["quantity"],
            additional_note=data.get("additional_note", "")
        )

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
        logger.error(f"Error handling request: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 400

@ngo_blueprint.route('/combined_data_json', methods=['GET'])
def get_combined_data_json():
    logger.debug(f"Fetching combined data with session: {session.get('user_id', 'No user_id')}")
    try:
        from Restaurant import DonationModel
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
        logger.debug(f"Returning combined data: {combined_data}")
        return jsonify(combined_data)
    except Exception as e:
        logger.error(f"Error in combined_data_json: {str(e)}")
        return jsonify({"status": "error", "message": "Failed to fetch combined data"}), 500

@ngo_blueprint.route('/events', methods=['GET', 'POST'])
def handle_events():
    if request.method == 'GET':
        try:
            now = datetime.now()

            # Update expired events
            expired_events = EventModel.query.filter(
                or_(
                    EventModel.event_date < now.date(),
                    and_(
                        EventModel.event_date == now.date(),
                        EventModel.end_time < now.time()
                    )
                ),
                EventModel.status == 'Active'
            ).all()

            for event in expired_events:
                event.status = 'Completed'
            db.session.commit()

            # Fetch active events
            events = EventModel.query.filter_by(status='Active').all()
            return jsonify([event.to_dict() for event in events]), 200
        except Exception as e:
            logger.error(f"Error fetching events: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 500

    if request.method == 'POST':
        try:
            data = request.get_json()
            logger.debug(f"Received event creation data: {data}")

            # Validate required fields
            required_fields = [
                'name', 'focus_area', 'volunteers_needed', 'event_date',
                'start_time', 'end_time', 'location', 'phone_number', 'description'
            ]
            if not all(field in data and data[field] for field in required_fields):
                logger.error("Missing or empty required fields in event creation")
                return jsonify({"status": "error", "message": "Required fields are missing or empty."}), 400

            # Validate session (assuming NGO admin is logged in)
            if 'user_id' not in session or session.get('organization') != 'ngo':
                logger.error("Unauthorized attempt to create event")
                return jsonify({"status": "error", "message": "Unauthorized. Please log in as an NGO admin."}), 401

            # Parse and validate dates/times
            try:
                event_date = datetime.strptime(data['event_date'], '%Y-%m-%d').date()
                start_time = datetime.strptime(data['start_time'], '%H:%M').time()
                end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            except ValueError as e:
                logger.error(f"Invalid date/time format: {str(e)}")
                return jsonify({"status": "error", "message": "Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time."}), 400

            # Validate volunteers_needed
            try:
                volunteers_needed = int(data['volunteers_needed'])
                if volunteers_needed <= 0:
                    raise ValueError
            except ValueError:
                logger.error("Invalid volunteers_needed value")
                return jsonify({"status": "error", "message": "Volunteers needed must be a positive integer."}), 400

            # Create new event
            new_event = EventModel(
                name=data['name'],
                focus_area=data['focus_area'],
                volunteers_needed=volunteers_needed,
                event_date=event_date,
                start_time=start_time,
                end_time=end_time,
                location=data['location'],
                phone_number=data['phone_number'],
                description=data['description'],
                status='Active'
            )
            db.session.add(new_event)
            db.session.commit()

            logger.debug(f"Event created with ID {new_event.id}")
            return jsonify({
                "status": "success",
                "message": "Event created successfully",
                "event_id": new_event.id
            }), 201

        except Exception as e:
            logger.error(f"Error creating event: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 500

@ngo_blueprint.route('/events/<int:event_id>/applications', methods=['GET'])
def get_event_applications(event_id):
    try:
        applications = Volunteer_application_model.query.filter_by(event_id=event_id).all()
        return jsonify([app.to_dict() for app in applications]), 200
    except Exception as e:
        logger.error(f"Error fetching applications for event {event_id}: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@ngo_blueprint.route('/volunteer_applications', methods=['POST'])
def submit_volunteer_application():
    try:
        data = request.json

        # Check if the volunteer has already applied for the same event
        existing_application = Volunteer_application_model.query.filter_by(
            Email=data['Email'],
            event_id=data['event_id']
        ).first()

        if existing_application:
            return jsonify({
                "status": "error",
                "message": f"You have already applied for the event '{data['event']}' with this email."
            }), 400

        # Create a new application
        new_application = Volunteer_application_model(
            volunteer_id=data['volunteer_id'],
            name=data['name'],
            Email=data['Email'],
            phone=data['phone'],
            City=data['City'],
            event=data['event'],
            event_id=data['event_id'],
            availability=data['availability'],
            reason=data['reason'],
            status=data.get('status', 'Pending'),  # Default to 'Pending' if not provided
            created_at=datetime.utcnow()
        )
        db.session.add(new_application)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Application submitted successfully!"
        }), 201
    except Exception as e:
        logger.error(f"Error submitting application: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

from Volunteer import Volunteer_application_model  # Add this import at the top of the file

@ngo_blueprint.route('/volunteer_applications/<int:application_id>/status', methods=['PATCH'])
def update_volunteer_application_status(application_id):
    logger.debug(f"Updating status for application ID: {application_id}")
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        logger.error("No status provided in the request")
        return jsonify({"status": "error", "message": "Status is required"}), 400

    application = Volunteer_application_model.query.get(application_id)
    if not application:
        logger.error(f"Application with ID {application_id} not found")
        return jsonify({"status": "error", "message": "Application not found"}), 404

    application.status = new_status
    db.session.commit()
    logger.debug(f"Application ID {application_id} status updated to {new_status}")
    return jsonify({"status": "success", "message": "Application status updated"})


def expire_events():
    

    now = datetime.now()
    expired_events = EventModel.query.filter(
        or_(
            EventModel.event_date < now.date(),
            and_(
                EventModel.event_date == now.date(),
                EventModel.end_time < now.time()
            )
        ),
        EventModel.status == 'Active'
    ).all()

    for event in expired_events:
        event.status = 'Completed'
        db.session.commit()
        logger.debug(f"Event ID {event.id} status updated to Completed")

