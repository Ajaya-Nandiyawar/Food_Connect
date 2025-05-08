from flask import Blueprint, request, render_template, jsonify, session, redirect, url_for
from datetime import datetime
from extensions import db, mail
from flask_mail import Message
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

volunteer_blueprint = Blueprint('volunteer', __name__)

class Volunteer_application_model(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    volunteer_id = db.Column(db.Integer, db.ForeignKey('volunteer.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    Email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    City = db.Column(db.String(100), nullable=False)
    event = db.Column(db.String(100))
    event_id = db.Column(db.Integer, db.ForeignKey('event_model.id'), nullable=True)
    availability = db.Column(db.String(100))
    reason = db.Column(db.Text)
    status = db.Column(db.String(20), default='Pending')  # Ensure this field exists
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'volunteer_id': self.volunteer_id,
            'name': self.name,
            'Email': self.Email,
            'phone': self.phone,
            'City': self.City,
            'event': self.event,
            'event_id': self.event_id,
            'availability': self.availability,
            'reason': self.reason,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

@volunteer_blueprint.route('/application', methods=['GET', 'POST'])
def submit_application():
    logger.debug(f"Handling /application with session: {session}")
    if 'user_id' not in session or 'email' not in session:
        logger.warning("No user_id or email in session, redirecting to login")
        return redirect(url_for('login'))

    from extensions import Volunteer  # Import here to avoid circular import
    user = Volunteer.query.get(session['user_id'])
    if not user:
        logger.error(f"User with ID {session['user_id']} not found, clearing session")
        session.clear()
        return redirect(url_for('login'))

    if request.method == 'GET':
        logger.debug(f"Rendering application form for user: {user.name}")
        return render_template('V-Application_form.html', name=user.name, email=user.email)

    if request.method == 'POST':
        try:
            name = request.form.get('name')
            email = request.form.get('Email')
            phone = request.form.get('phone')
            city = request.form.get('City')
            event = request.form.get('event')
            availability = request.form.get('availability')
            reason = request.form.get('reason')

            if not all([name, email, phone, city, event]):
                logger.error("Missing required fields in application form")
                return jsonify({"error": "Required fields are missing."}), 400

            # Check if application already exists for this volunteer
            existing_application = Volunteer_application_model.query.filter_by(
                volunteer_id=session['user_id'], Email=email, event=event
            ).first()
            if existing_application:
                logger.error(f"Application for {email} and event {event} already exists")
                return jsonify({"error": "You have already applied for this event."}), 400

            new_application = Volunteer_application_model(
                volunteer_id=session['user_id'],
                name=name,
                Email=email,
                phone=phone,
                City=city,
                event=event,
                availability=availability,
                reason=reason
            )
            db.session.add(new_application)
            db.session.commit()

            logger.debug(f"Application created with ID {new_application.id} for user: {user.name}")

            msg = Message(
                subject='Volunteer Application Submitted',
                recipients=[email],
                body=f"Dear {name},\n\nThank you for applying to volunteer at the {event} event!\n\n"
                     f"Details:\n- City: {city}\n- Availability: {availability or 'N/A'}\n- Reason: {reason or 'N/A'}\n\n"
                     f"We will review your application and get back to you soon.\n\nBest regards,\nFoodConnect Team"
            )
            mail.send(msg)

            logger.debug(f"Redirecting to dashboard for user: {user.name}")
            return redirect(url_for('volunteer.dashboard'))

        except Exception as e:
            logger.error(f"Error processing application: {str(e)}")
            return jsonify({"error": str(e)}), 500

@volunteer_blueprint.route('/dashboard')
def dashboard():
    logger.debug(f"Accessing dashboard with session: {session}")
    if 'user_id' not in session or 'email' not in session:
        logger.warning("No user_id or email in session, redirecting to login")
        return redirect(url_for('login'))

    from extensions import Volunteer
    user = Volunteer.query.get(session['user_id'])
    if not user:
        logger.error(f"User with ID {session['user_id']} not found, clearing session")
        session.clear()
        return redirect(url_for('login'))

    logger.debug(f"Rendering dashboard for user: {user.name}")
    return render_template('Volunteer_dashboard.html', name=user.name, user=user, volunteer_id=user.id)

@volunteer_blueprint.route('/login', methods=['GET', 'POST'])
def login():
    logger.debug(f"Handling /Volunteer/login with session: {session}")
    if request.method == 'POST':
        try:
            email = request.form.get('email')
            from extensions import Volunteer
            user = Volunteer.query.filter_by(email=email).first()
            if not user:
                logger.error(f"Login failed: No user found with email {email}")
                return jsonify({"error": "User not found"}), 404
            session['user_id'] = user.id
            session['email'] = user.email
            session['name'] = user.name
            session['organization'] = 'volunteer'
            session.permanent = True
            logger.debug(f"Login successful, set session user_id to {user.id}")
            return redirect(url_for('volunteer.dashboard'))
        except Exception as e:
            logger.error(f"Error during login: {str(e)}")
            return jsonify({"error": str(e)}), 500
    return render_template('login.html')

@volunteer_blueprint.route('/logout')
def logout():
    logger.debug(f"Logging out, session before: {session}")
    session.clear()
    logger.debug("Cleared session")
    return redirect(url_for('login'))

@volunteer_blueprint.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    from extensions import Volunteer  # Import Volunteer model here
    volunteers = Volunteer.query.all()  # Replace with your ORM query
    return jsonify([{
        'id': v.id,
        'first_name': v.first_name,
        'last_name': v.last_name
    } for v in volunteers])

@volunteer_blueprint.route('/api/volunteers/<int:volunteer_id>', methods=['GET'])
def get_volunteer_details(volunteer_id):
    from extensions import Volunteer  # Import Volunteer model here
    volunteer = Volunteer.query.get(volunteer_id)  # Replace with your ORM query
    if not volunteer:
        return jsonify({'error': 'Volunteer not found'}), 404
    return jsonify({
        'task': volunteer.task,
        'date_of_completion': volunteer.date_of_completion,
        'hours_served': volunteer.hours_served,
        'supervisor_name': volunteer.supervisor_name,
        'supervisor_title': volunteer.supervisor_title,
        'organization_name': volunteer.organization_name
    })


