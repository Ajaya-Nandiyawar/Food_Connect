from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template
from extensions import db, mail
from datetime import datetime
from flask_mail import Message
from geopy.geocoders import Nominatim
from notifications import send_notification
import logging
from sqlalchemy import and_, or_
from Volunteer import Volunteer_application_model
from sqlalchemy.exc import IntegrityError, DataError

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
    status = db.Column(db.String(20), default='Active')
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

class Certificates(db.Model):
    __tablename__ = 'certificates'
    id = db.Column(db.Integer, primary_key=True)
    volunteer_id = db.Column(db.Integer, db.ForeignKey('volunteer.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event_model.id'), nullable=False)
    application_id = db.Column(db.Integer, db.ForeignKey('volunteer_application_model.id'), nullable=False)
    certificate_link = db.Column(db.String(255), nullable=False)
    certificate_number = db.Column(db.String(50), nullable=False)
    issue_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "volunteer_id": self.volunteer_id,
            "event_id": self.event_id,
            "application_id": self.application_id,
            "certificate_link": self.certificate_link,
            "certificate_number": self.certificate_number,
            "issue_date": self.issue_date.strftime('%Y-%m-%d'),
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S')
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
            "location": "Success",
        }), 201

    except Exception as e:
        logger.error(f"Error handling request: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 400

@ngo_blueprint.route('/combined_data_json', methods=['GET'])
def get_combined_data_json():
    logger.debug(f"Fetching combined data with session: {session.get('user_id', 'No user_id') }")
    try:
        from Restaurant import DonationModel
        ngo_requests = RequestModel.query.order_by(RequestModel.created_at.desc()).all()
        ngo_formatted = [
            {
                "position": {"lat": req.latitude, "lng": req.longitude},
                "title": f"{req.location} Donation Request",
                "description": req.food_category,
                "quantity": f"{req.quantity} kg",
                "contact": req.phone_number,
                "type": "Organization",
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
            now_utc = datetime.utcnow()
            logger.debug(f"handle_events: now (local)={now}, now (UTC)={now_utc}")

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
                logger.debug(f"handle_events: expiring event {event.id} ({event.name}) - event_date={event.event_date}, end_time={event.end_time}")
                event.status = 'Completed'
                approved_apps = Volunteer_application_model.query.filter_by(event_id=event.id, status='Approved').all()
                logger.debug(f"handle_events: found {len(approved_apps)} accepted applications for event {event.id}")
                for app in approved_apps:
                    logger.debug(f"handle_events: setting volunteer app {app.id} to completed")
                    app.status = 'Completed'
            db.session.commit()
        
            # Fetch active and completed events
            events = EventModel.query.filter(EventModel.status.in_(['Active', 'Completed'])).all()
            return jsonify([event.to_dict() for event in events]), 200
        except Exception as e:
            logger.error(f"Error fetching events: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 500

    if request.method == 'POST':
        try:
            data = request.get_json()
            logger.debug(f"Received event creation data: {data}")

            required_fields = [
                'name', 'focus_area', 'volunteers_needed', 'event_date',
                'start_time', 'end_time', 'location', 'phone_number', 'description'
            ]
            if not all(field in data and data[field] for field in required_fields):
                logger.error("Missing or empty required fields in event creation")
                return jsonify({"status": "error", "message": "Required fields are missing or empty."}), 400

            if 'user_id' not in session or session.get('organization') != 'ngo':
                logger.error("Unauthorized attempt to create event")
                return jsonify({"status": "error", "message": "Unauthorized. Please log in as an NGO admin."}), 401

            try:
                event_date = datetime.strptime(data['event_date'], '%Y-%m-%d').date()
                start_time = datetime.strptime(data['start_time'], '%H:%M').time()
                end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            except ValueError as e:
                logger.error(f"Invalid date/time format: {str(e)}")
                return jsonify({"status": "error", "message": "Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time."}), 400

            try:
                volunteers_needed = int(data['volunteers_needed'])
                if volunteers_needed <= 0:
                    raise ValueError
            except ValueError:
                logger.error("Invalid volunteers_needed value")
                return jsonify({"status": "error", "message": "Volunteers needed must be a positive integer."}), 400

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
    expire_events()
    try:
        applications = Volunteer_application_model.query.filter_by(event_id=event_id).all()
        return jsonify([app.to_dict() for app in applications]), 200
    except Exception as e:
        logger.error(f"Error fetching applications for event {event_id}: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@ngo_blueprint.route('/volunteer_applications', methods=['POST'])
def submit_volunteer_application():
    try:
        if not request.is_json:
            logger.error("Request is not JSON")
            return jsonify({"status": "error", "message": "Request must be JSON"}), 400

        data = request.get_json()
        logger.debug(f"Received application data: {data}")

        required_fields = ['event_id', 'volunteer_id', 'name', 'Email', 'phone', 'City', 'event']
        if not all(field in data for field in required_fields):
            missing = [field for field in required_fields if field not in data]
            logger.error(f"Missing required fields: {missing}")
            return jsonify({"status": "error", "message": f"Missing required fields: {missing}"}), 400

        try:
            event_id = int(data['event_id'])
            volunteer_id = int(data['volunteer_id'])
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid event_id or volunteer_id: {str(e)}")
            return jsonify({"status": "error", "message": "Event ID and Volunteer ID must be integers"}), 400

        from extensions import Volunteer
        volunteer = Volunteer.query.get(volunteer_id)
        if not volunteer:
            logger.error(f"Volunteer not found: volunteer_id={volunteer_id}")
            return jsonify({"status": "error", "message": "Volunteer not found"}), 404

        event = EventModel.query.get(event_id)
        if not event:
            logger.error(f"Event not found: event_id={event_id}")
            return jsonify({"status": "error", "message": "Event not found"}), 404

        # Check for expired events before processing the application
        expire_events()

        if event.status != "Active":
            logger.error(f"Event is not active: event_id={event_id}, status={event.status}")
            return jsonify({"status": "error", "message": "Event is not accepting applications"}), 400

        event_datetime = datetime.combine(event.event_date, event.end_time)
        if event_datetime < datetime.utcnow():
            logger.debug(f"Event has ended: event_id={event_id}")
            event.status = 'Completed'
            db.session.commit()
            return jsonify({"status": "error", "message": "Event has ended"}), 400

        existing_application = Volunteer_application_model.query.filter_by(
            volunteer_id=volunteer_id,
            event_id=event_id
        ).first()
        if existing_application and existing_application.status not in ['Rejected', 'Cancelled']:
            logger.debug(f"Duplicate application: volunteer_id={volunteer_id}, event_id={event_id}")
            return jsonify({
                "status": "error",
                "message": f"You have already applied for the event '{data['event']}'."
            }), 400

        new_application = Volunteer_application_model(
            volunteer_id=volunteer_id,
            name=data['name'],
            Email=data['Email'],
            phone=data['phone'],
            City=data['City'],
            event=data['event'],
            event_id=event_id,
            availability=data.get('availability', ''),
            reason=data.get('reason', ''),
            status='Pending',
            created_at=datetime.utcnow()
        )
        db.session.add(new_application)
        db.session.commit()
        logger.debug(f"Application created: application_id={new_application.id}")

        try:
            msg = Message(
                'Volunteer Application Submitted',
                recipients=[data['Email']],
                body=f"Dear {data['name']},\n\nYour application for {data['event']} has been submitted successfully. We will notify you once it is reviewed.\n\nThank you,\nFoodConnect Team"
            )
            mail.send(msg)
            logger.debug(f"Confirmation email sent to {data['Email']}")
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")

        return jsonify({
            "status": "success",
            "message": "Application submitted successfully!",
            "application_id": new_application.id
        }), 201

    except IntegrityError as e:
        db.session.rollback()
        logger.error(f"Database integrity error: {str(e)} | Data: {data}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    except DataError as e:
        db.session.rollback()
        logger.error(f"Database data error: {str(e)}")
        return jsonify({"status": "error", "message": "Invalid data format provided."}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Unexpected error submitting application: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Failed to submit application. Please try again."}), 500

@ngo_blueprint.route('/volunteer_applications/<int:application_id>/status', methods=['PATCH'])
def update_volunteer_application_status(application_id):
    logger.debug(f"Updating status for application ID: {application_id}")
    data = request.get_json()
    new_status = data.get('status')

    # Use consistent status values that match your database
    valid_statuses = ['Pending', 'Approved', 'Completed', 'Rejected', 'Cancelled']
    if not new_status or new_status not in valid_statuses:
        logger.error(f"Invalid status provided: {new_status}")
        return jsonify({"status": "error", "message": f"Invalid status. Must be one of {valid_statuses}"}), 400

    application = Volunteer_application_model.query.get(application_id)
    if not application:
        logger.error(f"Application with ID {application_id} not found")
        return jsonify({"status": "error", "message": "Application not found"}), 404

    application.status = new_status
    db.session.commit()
    logger.debug(f"Application ID {application_id} status updated to {new_status}")

    try:
        msg = Message(
            'Volunteer Application Status Updated',
            recipients=[application.Email],
            body=f"Dear {application.name},\n\nYour application for {application.event} has been updated to '{new_status}'.\n\nThank you,\nFoodConnect Team"
        )
        mail.send(msg)
        logger.debug(f"Status update email sent to {application.Email}")
    except Exception as e:
        logger.error(f"Failed to send status update email: {str(e)}")

    return jsonify({"status": "success", "message": "Application status updated"})

def expire_events():
    now = datetime.now()
    now_utc = datetime.utcnow()
    logger.debug(f"expire_events: now (local)={now}, now (UTC)={now_utc}")
    
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
    
    logger.debug(f"expire_events: found {len(expired_events)} expired events")
    for event in expired_events:
        logger.debug(f"expire_events: expiring event {event.id} ({event.name}) - event_date={event.event_date}, end_time={event.end_time}")
        event.status = 'Completed'
        approved_apps = Volunteer_application_model.query.filter_by(event_id=event.id, status='Approved').all()
        logger.debug(f"expire_events: found {len(approved_apps)} approved applications for event {event.id}")
        for app in approved_apps:
            logger.debug(f"expire_events: setting volunteer app {app.id} to Completed")
            app.status = 'Completed'
    db.session.commit()

@ngo_blueprint.route('/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    event = EventModel.query.get(event_id)
    if not event:
        return jsonify({"status": "error", "message": "Event not found"}), 404
    try:
        # Delete related volunteer applications first
        Volunteer_application_model.query.filter_by(event_id=event_id).delete()
        db.session.delete(event)
        db.session.commit()
        logger.debug(f"Event ID {event_id} deleted successfully")
        return jsonify({"status": "success", "message": "Event deleted successfully"})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting event {event_id}: {str(e)}")
        return jsonify({"status": "error", "message": "Failed to delete event"}), 500

@ngo_blueprint.route('/generate_certificate/<int:application_id>', methods=['POST'])
def generate_certificate(application_id):
    try:
        # Fetch the application
        app = Volunteer_application_model.query.get(application_id)
        if not app:
            return jsonify({"status": "error", "message": "Application not found"}), 404

        if app.status != 'Completed':
            return jsonify({"status": "error", "message": "Certificate can only be generated for completed applications"}), 400

        if app.certificate_link:
            return jsonify({"status": "success", "message": "Certificate already generated", "certificate_link": app.certificate_link})

        event = EventModel.query.get(app.event_id)
        if not event:
            return jsonify({"status": "error", "message": "Event not found"}), 404

        from extensions import Volunteer
        volunteer = Volunteer.query.get(app.volunteer_id)
        if not volunteer:
            return jsonify({"status": "error", "message": "Volunteer not found"}), 404

        # Generate certificate number
        now = datetime.utcnow()
        certificate_number = f"VCR-{now.strftime('%Y%m%d')}-{application_id}"

        # Generate LaTeX content with styling from N-certification.css
        latex_content = r"""
        \documentclass[a4paper,landscape]{article}
        \usepackage[utf8]{inputenc}
        \usepackage{geometry}
        \geometry{a4paper, landscape, left=40mm, right=40mm, top=40mm, bottom=40mm}
        \usepackage{graphicx}
        \usepackage{xcolor}
        \usepackage{fontspec}
        \setmainfont{Times New Roman}
        \usepackage{tikz}
        \usepackage{eso-pic}
        \usepackage{fancyhdr}
        \pagestyle{fancy}
        \fancyhf{}
        \renewcommand{\headrulewidth}{0pt}
        \fancyhead[L]{\includegraphics[height=2cm]{/path/to/logo.png}}
        \fancyhead[R]{\small \color{gray} Certificate No: """ + certificate_number + r""" \\ Verification URL: ngo.org/verify/""" + certificate_number + r""" \\ Issue Date: """ + now.strftime('%B %d, %Y') + r"""}
        \begin{document}

        % Background and borders
        \begin{tikzpicture}[remember picture, overlay]
            % Outer border (20px equivalent)
            \draw[line width=5mm, color=gray!10] (current page.north west) rectangle (current page.south east);
            % Inner border 1
            \draw[line width=0.5mm, color=gray!30] ([xshift=10mm, yshift=-10mm]current page.north west) rectangle ([xshift=-10mm, yshift=10mm]current page.south east);
            % Inner border 2
            \draw[line width=0.3mm, color=gray!20] ([xshift=15mm, yshift=-15mm]current page.north west) rectangle ([xshift=-15mm, yshift=15mm]current page.south east);
            % Watermark
            \node[rotate=-45, text opacity=0.03, font=\Huge\bfseries, black] at (current page.center) {CERTIFIED};
        \end{tikzpicture}

        % Main content
        \begin{center}
            \vspace*{1cm}

            % Certificate Title
            \Huge \color{black!90} \textbf{CERTIFICATE OF VOLUNTEER SERVICE} \\[0.5cm]

            % Program Name
            \normalsize \color{gray!70} \textbf{Community Food Distribution Program} \\[0.2cm]

            % Organization
            \normalsize \color{gray!70} Organization: Community Helpers NGO \\[1cm]

            % Volunteer Name
            \huge \color[HTML]{2196F3} \textbf{ """ + app.name + r""" } \\[0.5cm]

            % Completion Date and Hours
            \normalsize \color{gray!70} Completion Date: """ + event.event_date.strftime('%B %d, %Y') + r""" \\[0.2cm]
            \normalsize \color{gray!70} Hours Served: 8 hours \\[2cm]

            % Signatures
            \begin{minipage}{0.4\textwidth}
                \begin{center}
                    \color{black!90} \rule{4cm}{0.4pt} \\
                    \normalsize \color{black!80} David Wilson \\
                    \small \color{gray!60} Program Director
                \end{center}
            \end{minipage}
            \hfill
            \begin{minipage}{0.4\textwidth}
                \begin{center}
                    \color{black!90} \rule{4cm}{0.4pt} \\
                    \normalsize \color{black!80} Maria Garcia \\
                    \small \color{gray!60} Executive Director
                \end{center}
            \end{minipage}
        \end{center}

        % Stamp (bottom right)
        \begin{tikzpicture}[remember picture, overlay]
            \node at ([xshift=-2cm, yshift=2cm]current page.south east) {\includegraphics[width=3cm, opacity=0.7]{/path/to/stamp.png}};
        \end{tikzpicture}

        \end{document}
        """

        # Placeholder for certificate link (in a real app, you'd save the PDF to a storage service)
        certificate_link = f"/certificates/{certificate_number}.pdf"

        # Store certificate in the database
        new_certificate = Certificates(
            volunteer_id=app.volunteer_id,
            event_id=app.event_id,
            application_id=app.id,
            certificate_link=certificate_link,
            certificate_number=certificate_number,
            issue_date=now
        )
        db.session.add(new_certificate)
        app.certificate_link = certificate_link
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Certificate generated successfully",
            "certificate_link": certificate_link,
            "certificate_number": certificate_number,
            "issue_date": now.strftime('%B %d, %Y')
        })
    except Exception as e:
        logger.error(f"Error generating certificate: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500