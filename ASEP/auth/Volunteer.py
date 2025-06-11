from flask import Blueprint, request, render_template, jsonify, session, redirect, url_for
from datetime import datetime
from extensions import db, mail, Volunteer
from flask_mail import Message
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

volunteer_blueprint = Blueprint('volunteer', __name__)

class Volunteer_application_model(db.Model):
    __tablename__ = 'volunteer_application_model'
    id = db.Column(db.Integer, primary_key=True)
    volunteer_id = db.Column(db.Integer, db.ForeignKey('volunteer.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    Email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    City = db.Column(db.String(100), nullable=False)
    event = db.Column(db.String(100), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event_model.id'), nullable=False)
    availability = db.Column(db.String(100))
    reason = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    certificate_link = db.Column(db.String(255), nullable=True)  # Added certificate_link field

    __table_args__ = (
        db.UniqueConstraint('volunteer_id', 'event_id', name='unique_volunteer_event'),
    )

    def to_dict(self):
        from NGO import EventModel
        event = EventModel.query.get(self.event_id)
        event_date = event.event_date.strftime('%Y-%m-%d') if event else 'N/A'
        return {
            "id": self.id,
            "volunteer_id": self.volunteer_id,
            "name": self.name,
            "Email": self.Email,
            "phone": self.phone,
            "City": self.City,
            "event": self.event,
            "event_id": self.event_id,
            "event_date": event_date,
            "availability": self.availability,
            "reason": self.reason,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "certificate_link": self.certificate_link  # Include certificate_link in response
        }

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
    from extensions import Volunteer
    volunteers = Volunteer.query.all()
    return jsonify([{
        'id': v.id,
        'first_name': v.first_name,
        'last_name': v.last_name
    } for v in volunteers])

@volunteer_blueprint.route('/api/volunteers/<int:volunteer_id>', methods=['GET'])
def get_volunteer_details(volunteer_id):
    from extensions import Volunteer
    volunteer = Volunteer.query.get(volunteer_id)
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

@volunteer_blueprint.route('/applications/<int:volunteer_id>', methods=['GET'])
def get_volunteer_applications(volunteer_id):
    try:
        from extensions import Volunteer
        from NGO import expire_events  # Import expire_events from NGO.py

        # Ensure event and application statuses are updated
        expire_events()

        volunteer = Volunteer.query.get(volunteer_id)
        if not volunteer:
            logger.error(f"Volunteer not found: volunteer_id={volunteer_id}")
            return jsonify({"status": "error", "message": "Volunteer not found"}), 404

        applications = Volunteer_application_model.query.filter_by(
            volunteer_id=volunteer_id
        ).order_by(Volunteer_application_model.created_at.desc()).all()
        logger.debug(f"Fetched {len(applications)} applications for volunteer_id={volunteer_id}")
        return jsonify([app.to_dict() for app in applications]), 200
    except Exception as e:
        logger.error(f"Error fetching applications for volunteer {volunteer_id}: {str(e)}")
        return jsonify({"status": "error", "message": "Failed to fetch applications."}), 500
    

@volunteer_blueprint.route('/applications/<int:volunteer_id>', methods=['GET'])
def applications(volunteer_id):
    
    volunteer = Volunteer.query.get_or_404(volunteer_id)
    applications = Volunteer_application_model.query.filter_by(volunteer_id=volunteer_id).all()
    return jsonify([app.to_dict() for app in applications])