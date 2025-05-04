from flask import Blueprint, request, render_template, jsonify, session
from datetime import datetime
from extensions import db, mail
from flask_mail import Message


volunteer_blueprint = Blueprint('volunteer', __name__)

class Volunteer_application_model(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    Email = db.Column(db.String(100), nullable=False, unique=True)
    phone = db.Column(db.String(15), nullable=False)
    City = db.Column(db.String(100), nullable=False)
    event = db.Column(db.String(100), nullable=False)
    availability = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@volunteer_blueprint.route('/application', methods=['GET', 'POST'])
def submit_application():
    if request.method == 'GET':
        if 'user_id' in session:
            user = Volunteer_application_model.query.get(session['user_id'])
            if user:
                return render_template('Volunteer_dashboard.html', user=user)
        else:
            return render_template('Volunteer_dashboard.html')
        return render_template('Volunteer_dashboard.html')

    try:
        if request.method == 'POST':
            name = request.form.get('name')
            email = request.form.get('Email')
            phone = request.form.get('phone')
            city = request.form.get('City')
            event = request.form.get('event')
            availability = request.form.get('availability')
            reason = request.form.get('reason')

            if not all([name, email, phone, city, event, availability, reason]):
                return jsonify({"error": "All fields are required."}), 400
            
            if Volunteer_application_model.query.filter_by(Email=email).first():
                return jsonify({"error": "Email already exists."}), 400
            
            if Volunteer_application_model.query.filter_by(phone=phone).first():
                return jsonify({"error": "Phone number already exists."}), 400
            
            if Volunteer_application_model.query.filter_by(name=name).first():
                return jsonify({"error": "Name already exists."}), 400
            
            
            new_application = Volunteer_application_model(
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

            msg = Message(
                subject='Volunteer Application Submitted',
                recipients=[email],
                body=f"Dear {name},\n\nThank you for applying to volunteer at the {event} event!\n\n"
                     f"Details:\n- City: {city}\n- Availability: {availability}\n- Reason: {reason or 'N/A'}\n\n"
                     f"We will review your application and get back to you soon.\n\nBest regards,\nFoodConnect Team"
            )
            mail.send(msg)

            return render_template('Volunteer_dashboard.html', user=new_application)
                          
    except Exception as e:
        return jsonify({"error": str(e)}), 500