from flask import Blueprint, jsonify, request, session, redirect, url_for
from extensions import db, CertificateRequest, Event, VolunteerAttendance, Volunteer, NGO
from functools import wraps
from datetime import datetime

event_blueprint = Blueprint('event', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'email' not in session or 'organization' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def ngo_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('organization') != 'ngo':
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def volunteer_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('organization') != 'volunteer':
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@event_blueprint.route('/end_event/<int:event_id>', methods=['POST'])
@login_required
@ngo_required
def end_event(event_id):
    event = Event.query.get_or_404(event_id)
    if event.is_completed:
        return jsonify({"success": False, "message": "Event already completed"}), 400

    event.is_completed = True
    db.session.commit()

    # Generate certificate requests for volunteers who attended
    attendances = VolunteerAttendance.query.filter_by(event_id=event_id, attended=True).all()
    for attendance in attendances:
        certificate_request = CertificateRequest(
            volunteer_id=attendance.volunteer_id,
            event_id=event_id,
            hours_served=attendance.hours_served,
            supervisor=session.get('name', 'NGO Manager'),
            comments=f"Participated in {event.name}",
            status='Pending'
        )
        db.session.add(certificate_request)
    db.session.commit()

    return jsonify({"success": True, "message": "Event ended and certificate requests generated"}), 200

@event_blueprint.route('/certificate_requests', methods=['GET'])
@login_required
@ngo_required
def get_certificate_requests():
    requests = CertificateRequest.query.join(Event).join(Volunteer).filter(Event.ngo_id==NGO.query.filter_by(email=session['email']).first().id).all()
    data = [{
        'id': req.id,
        'volunteer': req.volunteer.name,
        'task': req.event.name,
        'date': req.event.date.strftime('%Y-%m-%d'),
        'hours': req.hours_served,
        'supervisor': req.supervisor,
        'comments': req.comments,
        'status': req.status
    } for req in requests]
    return jsonify(data)

@event_blueprint.route('/approve_certificate/<int:request_id>', methods=['POST'])
@login_required
@ngo_required
def approve_certificate(request_id):
    certificate = CertificateRequest.query.get_or_404(request_id)
    certificate.status = 'Approved'
    db.session.commit()
    return jsonify({"success": True, "message": "Certificate approved"}), 200

@event_blueprint.route('/decline_certificate/<int:request_id>', methods=['POST'])
@login_required
@ngo_required
def decline_certificate(request_id):
    data = request.get_json()
    reason = data.get('reason', '')
    certificate = CertificateRequest.query.get_or_404(request_id)
    certificate.status = 'Declined'
    certificate.decline_reason = reason
    db.session.commit()
    return jsonify({"success": True, "message": "Certificate declined"}), 200

@event_blueprint.route('/volunteer_certificates', methods=['GET'])
@login_required
@volunteer_required
def get_volunteer_certificates():
    certificates = CertificateRequest.query.filter_by(volunteer_id=Volunteer.query.filter_by(email=session['email']).first().id).all()
    data = [{
        'id': cert.id,
        'certId': f"CERT-{cert.id:03d}",
        'task': cert.event.name,
        'date': cert.event.date.strftime('%Y-%m-%d'),
        'hours': cert.hours_served,
        'status': cert.status,
        'supervisor': cert.supervisor,
        'declineReason': cert.decline_reason or ''
    } for cert in certificates]
    return jsonify(data)

@event_blueprint.route('/download_certificate/<int:certificate_id>', methods=['GET'])
@login_required
@volunteer_required
def download_certificate(certificate_id):
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from flask import send_file
    import io

    certificate = CertificateRequest.query.get_or_404(certificate_id)
    if certificate.status != 'Approved' or certificate.volunteer.email != session['email']:
        return jsonify({"success": False, "message": "Unauthorized or invalid certificate"}), 403

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(100, 700, "Certificate of Volunteer Service")
    c.setFont("Helvetica", 14)
    c.drawString(100, 650, f"This certifies that {certificate.volunteer.name}")
    c.drawString(100, 630, f"has completed {certificate.hours_served} hours of volunteer service")
    c.drawString(100, 610, f"for {certificate.event.name}")
    c.drawString(100, 590, f"on {certificate.event.date.strftime('%Y-%m-%d')}")
    c.drawString(100, 550, f"Supervised by: {certificate.supervisor}")
    c.showPage()
    c.save()
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name=f"certificate_{certificate_id}.pdf", mimetype='application/pdf')