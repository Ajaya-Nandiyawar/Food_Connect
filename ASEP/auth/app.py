from flask import Flask, request, session, render_template, redirect, url_for, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from flask_wtf import CSRFProtect
from extensions import db
from forms import ForgotPasswordForm, ResetPasswordForm,  SignupForm # Import the form class
import bcrypt, os
from NGO import ngo_blueprint, RequestModel
from Restaurant import restaurant_blueprint
import pyrebase
from notifications import notifications_bp





# Initialize the Flask app
app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Set a secret key for sessions

csrf = CSRFProtect(app)


app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'foodconnect5621@gmail.com'
app.config['MAIL_PASSWORD'] = 'nqkl tveg zbys hqkr'
app.config['MAIL_DEFAULT_SENDER'] = 'foodconnect5621@gmail.com'

mail = Mail(app)
s = URLSafeTimedSerializer(app.secret_key)

# MySQL connection string
db_user = "root"
db_password = "Rishi%400211"  # URL-encoded password (%40 represents @)
db_host = "127.0.0.1"
db_name = "food_sharing"

# Configuring database URI
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking


# Register blueprint before app initialization (if using blueprints)
app.register_blueprint(ngo_blueprint, url_prefix='/ngo')
mail = Mail(app)
app.register_blueprint(notifications_bp, url_prefix='/notifications')
app.register_blueprint(restaurant_blueprint, url_prefix='/Restaurant')

# Initialize SQLAlchemy with the app
db.init_app(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)  # Store hashed password as a string
    organization = db.Column(db.String(50), nullable=False)
    
    def __init__(self, name, email, password, organization):
        self.name = name
        self.organization = organization
        self.email = email
        # Hash password and decode it to store as string
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        # Encode stored password to bytes for comparison
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))

# Create database tables manually using app context
def create_tables():
    with app.app_context():
        db.create_all()

# Call this function once before running the app
create_tables()

# Routes
@app.route('/')
def home():
    return render_template('home page.html')  # Ensure file name matches template

@app.route('/about_us')
def about_us():
    return render_template('about_us.html')  # Ensure file name matches template

from forms import LoginForm  # Import the form

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    
    if form.validate_on_submit():
        email = form.email.data
        password = form.password.data
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            session['name'] = user.name
            session['email'] = user.email
            session['organization'] = user.organization
            
            if session.get('first_time'):
                if user.organization.lower() == 'ngo':
                    return redirect('/N-guide')
                elif user.organization.lower() == 'restaurant':
                    return redirect('/R-guide')

            if user.organization.lower() == 'ngo':
                return redirect('/dashboard')
            elif user.organization.lower() == 'restaurant':
                return redirect('/restaurant_dashboard')

        flash("Invalid email or password", "error")

    return render_template('login.html', form=form)


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))  

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    form = SignupForm()

    if form.validate_on_submit():  # This will validate CSRF token too
        name = form.name.data
        email = form.email.data
        password = form.password.data
        organization = form.organization.data

        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return redirect(url_for('signup'))

        new_user = User(name=name, email=email, password=password, organization=organization)
        db.session.add(new_user)
        db.session.commit()

        session['name'] = new_user.name
        session['email'] = new_user.email
        session['organization'] = new_user.organization
        session['first_time'] = True

        return redirect(url_for('login'))  # Redirect to login page after successful signup

    return render_template('signup.html', form=form)

@app.route('/dashboard')
def dashboard():
    if 'name' in session and 'email' in session and 'organization' in session:
        api_key = 'AIzaSyA083VfuQXN3YIRY_uMmjldA8VhjIat5FE'  # Replace with your actual API key
        return render_template('dashboard2.html', name=session['name'], organization=session['organization'], api_key=api_key) 
    return redirect('/login')

@app.route('/profile', methods=['GET'])
def profile():
    if "email" not in session:
        return redirect("/login")  # Ensure the user is logged in

    # Check if the user exists in the database (for normal registration users)
    user = User.query.filter_by(email=session["email"]).first()

    if user:
        return render_template("settings.html", name=user.name, email=user.email)

    # If user is logged in via Firebase, use session data
    if "name" in session:
        return render_template("settings.html", name=session["name"], email=session["email"])

    return redirect("/login")  # If no valid session exists, redirect to login


@app.route('/notifications')
def notifications():
    return render_template('notification.html')

@app.route('/stat')
def stat():
    return render_template('stats.html')

@app.route('/N-guide')
def ngo_guide():
    session.pop('first_time', None)
    return render_template('NGO.html')

@app.route('/R-guide')
def restaurant_guide():
    session.pop('first_time', None)
    return render_template('Restaurant.html')

@app.route('/restaurant_dashboard')
def restaurant_dashboard():
    requests = RequestModel.query.order_by(RequestModel.created_at).all()
    return render_template('home.html', requests=requests)

@app.route('/restaurant_alerts')
def restaurant_alerts():
    return render_template('alert.html')

@app.route('/restaurant_requests')
def restaurant_requests():
    requests = RequestModel.query.order_by(RequestModel.created_at).all()
    return render_template('NGO Food Requests.html', requests=requests)

@app.route('/update_request_status/<int:request_id>', methods=['POST'])
def update_request_status(request_id):
    """Update the status of a food request."""
    
    # Ensure the request contains JSON
    if request.content_type != 'application/json':
        return jsonify({"success": False, "message": "Content-Type must be application/json"}), 415
    
    data = request.get_json()
    
    if not data or "status" not in data:
        return jsonify({"success": False, "message": "Invalid or missing JSON data"}), 400
    
    # Retrieve the request entry from the database
    request_entry = RequestModel.query.get(request_id)
    
    if not request_entry:
        return jsonify({"success": False, "message": "Request not found"}), 404

    # Update status
    request_entry.status = data["status"]
    db.session.commit()
    
    return jsonify({"success": True, "message": "Request status updated successfully"}), 200



@app.route('/restaurant_settings')
def restaurant_settings():
    return render_template('settings_rest.html')

firebase_config = {
    "apiKey": "AIzaSyBbW25iCUlAwslI_2zdoiIavEQe_Uiz_wo",
    "authDomain": "foodconnect-4e64e.firebaseapp.com",
    "projectId": "foodconnect-4e64e",
    "databaseURL": "https://foodconnect-4e64e-default-rtdb.firebaseio.com",
    "storageBucket": "foodconnect-4e64e.firebasestorage.app",
    "messagingSenderId": "574910241302",
    "appId": "1:574910241302:web:970aaa182b7d7f23387337",
    "measurementId": "G-KJ4QPSNTYY",
}

firebase = pyrebase.initialize_app(firebase_config)
auth = firebase.auth()

@app.route('/firebase-login', methods=['POST'])
def firebase_login():
    print("🔍 Received request at /firebase-login")  # Debugging

    # Check if request is JSON
    if not request.is_json:
        print("❌ Request is not JSON")
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    data = request.get_json()
    print("📨 Received data:", data)  # Debugging

    if not data or "idToken" not in data:
        print("❌ Missing idToken in request")
        return jsonify({"success": False, "message": "Missing idToken"}), 400  

    email = data.get("email")
    name = data.get("name")

    if not email:
        print("❌ Invalid email")
        return jsonify({"success": False, "message": "Invalid email"}), 400

    try:
        decoded_token = auth.verify_id_token(data["idToken"])  # Verify Firebase token
        user_email = decoded_token.get("email")
        print("✅ Firebase Token Verified for:", user_email)

        if not user_email:
            print("❌ Token verification failed")
            return jsonify({"success": False, "message": "Token verification failed"}), 401

        user = User.query.filter_by(email=user_email).first()

        if not user:
            session["email"] = user_email
            session["name"] = name
            print("🔄 New user, redirecting to select_type")
            return jsonify({"success": True, "redirect_url": url_for('select_type')})

        session["email"] = user.email
        session["name"] = user.name
        print("🏠 Existing user, redirecting to dashboard")
        return jsonify({"success": True, "redirect_url": url_for('dashboard')})

    except Exception as e:
        print("🔥 Error in Firebase verification:", str(e))
        return jsonify({"success": False, "message": str(e)}), 401

    
@app.after_request
def set_response_headers(response):
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response


@app.route('/select_type')
def user_type():
    if "email" not in session:
        return redirect("/login")
    return render_template("dash.html", name=session.get("name", "User"))    


@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    form = ForgotPasswordForm()  # Initialize the form

    if form.validate_on_submit():
        email = form.email.data
        user = User.query.filter_by(email=email).first()

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

    return render_template('Forgot_Pass.html', form=form)



@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    form = ResetPasswordForm()  # Create form instance

    try:
        email = s.loads(token, salt='password-reset', max_age=1800)
    except:
        flash('Invalid or expired token', 'error')
        return redirect(url_for('forgot_password'))

    if form.validate_on_submit():
        new_password = form.new_password.data  # Get validated password
        
        user = User.query.filter_by(email=email).first()
        if not user:
            flash('User not found', 'error')
            return redirect(url_for('forgot_password'))

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user.password = hashed_password
        db.session.commit()

        flash('Your password has been updated successfully!', 'success')
        return redirect(url_for('login'))

    return render_template('reset_pass.html', form=form, token=token)





# Run the app
if __name__ == '__main__':
    app.run(debug=True)
