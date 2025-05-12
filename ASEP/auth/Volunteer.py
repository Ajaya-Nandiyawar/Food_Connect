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
    volunteer_id = db.Column(db.Integer, nullable=False)  # Add this field
    name = db.Column(db.String(100), nullable=False)
    Email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    City = db.Column(db.String(100), nullable=False)
    event = db.Column(db.String(100), nullable=False)
    event_id = db.Column(db.Integer, nullable=False)
    availability = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pending')  # Add this field
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('Email', 'event_id', name='_email_event_uc'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "volunteer_id": self.volunteer_id,
            "name": self.name,
            "Email": self.Email,
            "phone": self.phone,
            "City": self.City,
            "event": self.event,
            "event_id": self.event_id,
            "availability": self.availability,
            "reason": self.reason,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }

@volunteer_blueprint.route('/application', methods=['POST'])
def submit_application():
    try:
        data = request.form
        # Process the form data and save it to the database
        return jsonify({"status": "success", "message": "Application submitted successfully!"}), 201
    except Exception as e:
        logger.error(f"Error submitting application: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

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


