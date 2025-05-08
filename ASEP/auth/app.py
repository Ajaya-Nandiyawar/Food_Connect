from flask import Flask, request, session, render_template, redirect, url_for, jsonify, flash, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from flask_wtf.csrf import CSRFProtect
from extensions import db, mail, NGO, Restaurant, Volunteer  # Import from extensions
from forms import ForgotPasswordForm, ResetPasswordForm, SignupForm, LoginForm
import os
import pyrebase
import json
from NGO import ngo_blueprint, RequestModel
from Restaurant import restaurant_blueprint
from Volunteer import volunteer_blueprint
from notifications import notifications_bp
import bcrypt
import firebase_admin
from firebase_admin import auth as admin_auth
from firebase_admin import credentials
from functools import wraps
from dotenv import load_dotenv
from threading import Timer
import cloudinary, cloudinary.uploader, cloudinary.api
from cloudinary.utils import cloudinary_url
from sqlalchemy import create_engine

load_dotenv()

service_account_json = os.getenv('SERVICE_ACCOUNT_KEY')
if service_account_json:
    cred = credentials.Certificate(json.loads(service_account_json))
    firebase_admin.initialize_app(cred)
else:
    raise ValueError("SERVICE_ACCOUNT_KEY not found in .env file")

def no_cache(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        resp = make_response(f(*args, **kwargs))
        resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private, max-age=0'
        resp.headers['Pragma'] = 'no-cache'
        resp.headers['Expires'] = '0'
        return resp
    return decorated_function

app = Flask(__name__)
app.secret_key = 'a39a0170b3e0428abcd1941ee87bedc93d5a9a286ee5c773'
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 1 day

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

csrf = CSRFProtect(app)

app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail.init_app(app)  # Initialize mail with app
s = URLSafeTimedSerializer(app.secret_key)

# Fetch database variables
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")
db_name = os.getenv("DB_NAME")

# Construct the SQLAlchemy connection string
DATABASE_URL = f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}?sslmode=require"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Test the connection
try:
    with engine.connect() as connection:
        print("Connection successful!")
except Exception as e:
    print(f"Failed to connect: {e}")

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Register blueprints
app.register_blueprint(ngo_blueprint, url_prefix='/ngo')
app.register_blueprint(notifications_bp, url_prefix='/notifications')
app.register_blueprint(restaurant_blueprint, url_prefix='/Restaurant')
app.register_blueprint(volunteer_blueprint, url_prefix='/Volunteer')

db.init_app(app)

def create_tables():
    with app.app_context():
        db.create_all()

create_tables()

# Routes
@app.route('/')
def home():
    return render_template('01_home_page.html')

@app.route('/about_us')
def about_us():
    return render_template('02_about_us.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        email = form.email.data
        password = form.password.data
        ngo = NGO.query.filter_by(email=email).first()
        restaurant = Restaurant.query.filter_by(email=email).first()
        volunteer = Volunteer.query.filter_by(email=email).first()
        if ngo and ngo.check_password(password):
            session['name'] = ngo.name
            session['email'] = ngo.email
            session['organization'] = 'ngo'
            session['user_id'] = ngo.id
            if session.get('first_time'):
                return redirect('/N-guide')
            return redirect('/dashboard')
        elif restaurant and restaurant.check_password(password):
            session['name'] = restaurant.name
            session['email'] = restaurant.email
            session['organization'] = 'restaurant'
            session['user_id'] = restaurant.id
            if session.get('first_time'):
                return redirect('/R-guide')
            return redirect('/restaurant_dashboard')
        elif volunteer and volunteer.check_password(password):
            session['name'] = volunteer.name
            session['email'] = volunteer.email
            session['organization'] = 'volunteer'
            session['user_id'] = volunteer.id
            if session.get('first_time'):
                return redirect('/V-guide')
            return redirect('/Volunteer/dashboard')  # Redirect to blueprint route
        else:
            flash("Invalid email or password", "error")
    response = make_response(render_template('03_login.html', form=form))
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    return response

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    form = SignupForm()
    if form.validate_on_submit():
        name = form.name.data
        email = form.email.data
        password = form.password.data
        organization = form.organization.data.lower()
        if NGO.query.filter_by(email=email).first() or Restaurant.query.filter_by(email=email).first() or Volunteer.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return redirect(url_for('signup'))
        if organization == 'ngo':
            new_user = NGO(name=name, email=email, password=password)
        elif organization == 'restaurant':
            new_user = Restaurant(name=name, email=email, password=password)
        elif organization == 'volunteer':
            new_user = Volunteer(name=name, email=email, password=password)
        else:
            flash('Invalid organization type', 'error')
            return redirect(url_for('signup'))
        db.session.add(new_user)
        db.session.commit()
        session['name'] = new_user.name
        session['email'] = new_user.email
        session['organization'] = organization
        session['user_id'] = new_user.id
        session['first_time'] = True
        return redirect(url_for('login'))
    return render_template('04_signup.html', form=form)

@app.route('/dashboard')
@no_cache
def dashboard():
    if 'name' not in session or 'email' not in session or 'organization' not in session:
        return redirect('/login')
    if session['organization'] != 'ngo':
        return redirect('/login')
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    return render_template('N-Dashboard.html', name=session['name'], organization=session['organization'], api_key=api_key)

@app.route('/restaurant_dashboard')
@no_cache
def restaurant_dashboard():
    if 'name' not in session or 'email' not in session or 'organization' not in session:
        return redirect('/login')
    if session['organization'] != 'restaurant':
        return redirect('/login')
    requests = RequestModel.query.order_by(RequestModel.created_at).all()
    return render_template('R-Dashboard.html', requests=requests)

@app.route('/volunteer_dashboard')
@no_cache
def volunteer_dashboard():
    volunteer_id = session.get('user_id', 0)
    if 'name' not in session or 'email' not in session or 'organization' not in session:
        return redirect('/login')
    if session['organization'] != 'volunteer':
        return redirect('/login')
    return redirect(url_for('volunteer.dashboard'))  # Redirect to blueprint route

@app.route('/profile', methods=['GET'])
@no_cache
def profile():
    if "email" not in session or "organization" not in session:
        return redirect("/login")
    organization = session["organization"].lower()
    email = session["email"]
    if organization == 'ngo':
        user = NGO.query.filter_by(email=email).first()
        if user:
            return render_template("N-Settings.html", name=user.name, email=user.email)
        else:
            return redirect("/login")
    elif organization == 'restaurant':
        return redirect(url_for('restaurant_settings'))
    elif organization == 'volunteer':
        user = Volunteer.query.filter_by(email=email).first()
        if user:
            return render_template("V-Profile.html", name=user.name, email=user.email)
        else:
            return redirect("/login")
    if "name" in session:
        return render_template("N-Settings.html", name=session["name"], email=session["email"])
    return redirect("/login")

@app.route('/notifications')
def notifications():
    return render_template('notification.html')

@app.route('/events_schedule')
def Events_schedule():
    return render_template('N-Events_schedule.html')

@app.route('/certification')
def certification():
    return render_template('N-certification.html', name=session.get("name", "User"))

@app.route('/N-guide')
def ngo_guide():
    session.pop('first_time', None)
    return render_template('NGO_guide.html')

@app.route('/R-guide')
def restaurant_guide():
    session.pop('first_time', None)
    return render_template('Restaurant_guide.html')

@app.route('/V-guide')
def volunteer_guide():
    session.pop('first_time', None)
    return render_template('Volunteer_guide.html')

@app.route('/restaurant_alerts')
def restaurant_alerts():
    return render_template('alert.html')

@app.route('/achievements')
def achievements():
    return render_template('achievements.html', name=session.get("name", "User"))

@app.route('/restaurant_requests')
def restaurant_requests():
    requests = RequestModel.query.order_by(RequestModel.created_at).all()
    return render_template('R-ngo_requests.html', requests=requests)

@app.route('/update_request_status/<int:request_id>', methods=['POST'])
def update_request_status(request_id):
    if request.content_type != 'application/json':
        return jsonify({"success": False, "message": "Content-Type must be application/json"}), 415
    data = request.get_json()
    if not data or "status" not in data:
        return jsonify({"success": False, "message": "Invalid or missing JSON data"}), 400
    request_entry = RequestModel.query.get(request_id)
    if not request_entry:
        return jsonify({"success": False, "message": "Request not found"}), 404
    request_entry.status = data["status"]
    db.session.commit()
    if data["status"] == "Accepted":
        def remove_request():
            with app.app_context():
                req = RequestModel.query.get(request_id)
                if req and req.status == "Accepted":
                    db.session.delete(req)
                    db.session.commit()
                    print(f"Request {request_id} removed after 30 minutes.")
        Timer(1800, remove_request).start()
    return jsonify({"success": True, "message": "Request status updated successfully"}), 200

@app.route('/restaurant_settings', methods=['GET'])
@no_cache
def restaurant_settings():
    if "email" not in session or "organization" not in session or session["organization"].lower() != 'restaurant':
        return redirect("/login")
    email = session["email"]
    user = Restaurant.query.filter_by(email=email).first()
    if user:
        return render_template("R-Settings.html", name=user.name, email=user.email)
    if "name" in session and session["organization"].lower() == 'restaurant':
        return render_template("R-Settings.html", name=session["name"], email=session["email"])
    return redirect("/login")

firebase_config = {
    "apiKey": os.getenv('FIREBASE_API_KEY'),
    "authDomain": os.getenv('FIREBASE_AUTH_DOMAIN'),
    "projectId": os.getenv('FIREBASE_PROJECT_ID'),
    "databaseURL": os.getenv('FIREBASE_DATABASE_URL'),
    "storageBucket": os.getenv('FIREBASE_STORAGE_BUCKET'),
    "messagingSenderId": os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
    "appId": os.getenv('FIREBASE_APP_ID'),
    "measurementId": os.getenv('FIREBASE_MEASUREMENT_ID'),
}

firebase = pyrebase.initialize_app(firebase_config)
auth = firebase.auth()

@app.route('/firebase-login', methods=['POST'])
@csrf.exempt
def firebase_login():
    if not request.is_json:
        return jsonify({"success": False, "message": "Request must be JSON"}), 400
    data = request.get_json()
    if not data or "idToken" not in data:
        return jsonify({"success": False, "message": "Missing idToken"}), 400
    try:
        decoded_token = admin_auth.verify_id_token(data["idToken"])
        user_email = decoded_token.get("email")
        if not user_email:
            return jsonify({"success": False, "message": "Invalid token"}), 401
        ngo = NGO.query.filter_by(email=user_email).first() if 'NGO' in globals() else None
        restaurant = Restaurant.query.filter_by(email=user_email).first() if 'Restaurant' in globals() else None
        volunteer = Volunteer.query.filter_by(email=user_email).first() if 'Volunteer' in globals() else None
        if not ngo and not restaurant and not volunteer:
            session["email"] = user_email
            session["name"] = data.get("name", "User")
            return jsonify({"success": True, "redirect_url": url_for('user_type')})
        if ngo:
            session["email"] = ngo.email
            session["name"] = ngo.name
            session["organization"] = "ngo"
            session["user_id"] = ngo.id
            redirect_url = url_for('dashboard')
        elif restaurant:
            session["email"] = restaurant.email
            session["name"] = restaurant.name
            session["organization"] = "restaurant"
            session["user_id"] = restaurant.id
            redirect_url = url_for('restaurant_dashboard')
        else:
            session["email"] = volunteer.email
            session["name"] = volunteer.name
            session["organization"] = "volunteer"
            session["user_id"] = volunteer.id
            redirect_url = url_for('volunteer.dashboard')
        return jsonify({"success": True, "redirect_url": redirect_url})
    except Exception as e:
        return jsonify({"success": False, "message": f"Firebase error: {str(e)}"}), 401

@app.route('/select_type')
def user_type():
    if "email" not in session:
        return redirect("/login")
    return render_template("dash.html", name=session.get("name", "User"))

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    form = ForgotPasswordForm()
    if form.validate_on_submit():
        email = form.email.data
        user = NGO.query.filter_by(email=email).first() or Restaurant.query.filter_by(email=email).first() or Volunteer.query.filter_by(email=email).first()
        if not user:
            flash('Email does not exist', 'error')
            return redirect(url_for('forgot_password'))
        token = s.dumps(email, salt='password-reset')
        reset_url = url_for('reset_password', token=token, _external=True)
        msg = Message('Password Reset Request', recipients=[email])
        msg.body = f'To reset your password, visit the following link: {reset_url}\n\nThis link will expire in 30 minutes.'
        mail.send(msg)
        flash('Password reset link has been sent to your email', 'success')
        return redirect(url_for('login'))
    return render_template('05_Forgot_Pass.html', form=form)

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    form = ResetPasswordForm()
    try:
        email = s.loads(token, salt='password-reset', max_age=1800)
    except:
        flash('Invalid or expired token', 'error')
        return redirect(url_for('forgot_password'))
    if form.validate_on_submit():
        new_password = form.new_password.data
        ngo = NGO.query.filter_by(email=email).first()
        restaurant = Restaurant.query.filter_by(email=email).first()
        volunteer = Volunteer.query.filter_by(email=email).first()
        if ngo:
            user = ngo
        elif restaurant:
            user = restaurant
        elif volunteer:
            user = volunteer
        else:
            flash('User not found', 'error')
            return redirect(url_for('forgot_password'))
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user.password = hashed_password
        db.session.commit()
        flash('Your password has been updated successfully!', 'success')
        return redirect(url_for('login'))
    return render_template('06_reset_pass.html', form=form, token=token)

@app.route('/events')
def events():
    return render_template('Events.html')

@app.route('/volunteer_settings', methods=['GET'])
@no_cache
def volunteer_settings():
    if "email" not in session or "organization" not in session or session["organization"].lower() != 'volunteer':
        return redirect("/login")
    email = session["email"]
    user = Volunteer.query.filter_by(email=email).first()
    if user:
        return render_template("V-Settings.html", name=user.name, email=user.email)
    if "name" in session and session["organization"].lower() == 'volunteer':
        return render_template("V-Settings.html", name=session["name"], email=session["email"])
    return redirect("/login")

@app.route('/application_form', methods=['GET'])
def application_form():
    if "email" not in session or "organization" not in session or session["organization"].lower() != 'volunteer':
        return redirect("/login")
    email = session["email"]
    user = Volunteer.query.filter_by(email=email).first()
    if user:
        return render_template("V-Application_form.html", name=user.name, email=user.email)
    return render_template("V-Application_form.html", name=session["name"], email=session["email"])

if __name__ == '__main__':
    app.run(debug=True)