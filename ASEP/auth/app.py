from flask import Flask, request, session, render_template, redirect, url_for, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from flask_wtf import CSRFProtect
from extensions import db, mail, NGO, Restaurant  # Import from extensions
from forms import ForgotPasswordForm, ResetPasswordForm, SignupForm, LoginForm
import os
import pyrebase
from NGO import ngo_blueprint, RequestModel
from Restaurant import restaurant_blueprint
from notifications import notifications_bp
import bcrypt

app = Flask(__name__)
app.secret_key = 'your_secret_key'

csrf = CSRFProtect(app)

# Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'foodconnect5621@gmail.com'
app.config['MAIL_PASSWORD'] = 'nqkl tveg zbys hqkr'
app.config['MAIL_DEFAULT_SENDER'] = 'foodconnect5621@gmail.com'

mail.init_app(app)  # Initialize mail with app
s = URLSafeTimedSerializer(app.secret_key)

# MySQL configuration
db_user = "root"
db_password = "%40J%21nky%40ub%40le5"
db_host = "127.0.0.1"
db_name = "registered"
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Register blueprints
app.register_blueprint(ngo_blueprint, url_prefix='/ngo')
app.register_blueprint(notifications_bp, url_prefix='/notifications')
app.register_blueprint(restaurant_blueprint, url_prefix='/Restaurant')

db.init_app(app)

def create_tables():
    with app.app_context():
        db.create_all()

create_tables()

# Routes (unchanged except for model references)
@app.route('/')
def home():
    return render_template('home page.html')

@app.route('/about_us')
def about_us():
    return render_template('about_us.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        email = form.email.data
        password = form.password.data
        ngo = NGO.query.filter_by(email=email).first()
        restaurant = Restaurant.query.filter_by(email=email).first()
        if ngo and ngo.check_password(password):
            session['name'] = ngo.name
            session['email'] = ngo.email
            session['organization'] = 'ngo'
            if session.get('first_time'):
                return redirect('/N-guide')
            return redirect('/dashboard')
        elif restaurant and restaurant.check_password(password):
            session['name'] = restaurant.name
            session['email'] = restaurant.email
            session['organization'] = 'restaurant'
            if session.get('first_time'):
                return redirect('/R-guide')
            return redirect('/restaurant_dashboard')
        else:
            flash("Invalid email or password", "error")
    return render_template('login.html', form=form)

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    form = SignupForm()
    if form.validate_on_submit():
        name = form.name.data
        email = form.email.data
        password = form.password.data
        organization = form.organization.data.lower()
        if NGO.query.filter_by(email=email).first() or Restaurant.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return redirect(url_for('signup'))
        if organization == 'ngo':
            new_user = NGO(name=name, email=email, password=password)
        elif organization == 'restaurant':
            new_user = Restaurant(name=name, email=email, password=password)
        else:
            flash('Invalid organization type', 'error')
            return redirect(url_for('signup'))
        db.session.add(new_user)
        db.session.commit()
        session['name'] = new_user.name
        session['email'] = new_user.email
        session['organization'] = organization
        session['first_time'] = True
        return redirect(url_for('login'))
    return render_template('signup.html', form=form)


@app.route('/dashboard')
def dashboard():
    if 'name' not in session or 'email' not in session or 'organization' not in session:
        return redirect('/login')
    if session['organization'] != 'ngo':
        return redirect('/login')  # Restrict to NGOs only
    api_key = 'AIzaSyA083VfuQXN3YIRY_uMmjldA8VhjIat5FE'
    return render_template('dashboard2.html', name=session['name'], organization=session['organization'], api_key=api_key)

@app.route('/restaurant_dashboard')
def restaurant_dashboard():
    if 'name' not in session or 'email' not in session or 'organization' not in session:
        return redirect('/login')
    if session['organization'] != 'restaurant':
        return redirect('/login')  # Restrict to Restaurants only
    requests = RequestModel.query.order_by(RequestModel.created_at).all()
    return render_template('home.html', requests=requests)


@app.route('/profile', methods=['GET'])
def profile():
    if "email" not in session or "organization" not in session:
        return redirect("/login")

    organization = session["organization"].lower()
    email = session["email"]

    if organization == 'ngo':
        user = NGO.query.filter_by(email=email).first()
        if user:
            return render_template("settings.html", name=user.name, email=user.email)
        else:
            return redirect("/login")
    elif organization == 'restaurant':
        return redirect(url_for('restaurant_settings'))  # Redirect to Restaurant-specific route

    # Fallback for Firebase or invalid cases
    if "name" in session and organization == 'ngo':
        return render_template("settings.html", name=session["name"], email=session["email"])

    return redirect("/login")


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


@app.route('/restaurant_settings', methods=['GET'])
def restaurant_settings():
    if "email" not in session or "organization" not in session or session["organization"].lower() != 'restaurant':
        return redirect("/login")

    email = session["email"]
    user = Restaurant.query.filter_by(email=email).first()
    if user:
        return render_template("settings_rest.html", name=user.name, email=user.email)

    # Fallback for Firebase
    if "name" in session and session["organization"].lower() == 'restaurant':
        return render_template("settings_rest.html", name=session["name"], email=session["email"])

    return redirect("/login")

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
    print("🔍 Received request at /firebase-login")
    if not request.is_json:
        print("❌ Request is not JSON")
        return jsonify({"success": False, "message": "Request must be JSON"}), 400

    data = request.get_json()
    print("📨 Received data:", data)
    if not data or "idToken" not in data:
        print("❌ Missing idToken in request")
        return jsonify({"success": False, "message": "Missing idToken"}), 400  

    email = data.get("email")
    name = data.get("name")
    if not email:
        print("❌ Invalid email")
        return jsonify({"success": False, "message": "Invalid email"}), 400

    try:
        decoded_token = auth.verify_id_token(data["idToken"])
        user_email = decoded_token.get("email")
        print("✅ Firebase Token Verified for:", user_email)
        if not user_email:
            print("❌ Token verification failed")
            return jsonify({"success": False, "message": "Token verification failed"}), 401

        # Check both NGO and Restaurant tables
        ngo = NGO.query.filter_by(email=user_email).first()
        restaurant = Restaurant.query.filter_by(email=user_email).first()

        if not ngo and not restaurant:
            # New user: Redirect to select organization type
            session["email"] = user_email
            session["name"] = name
            print("🔄 New user, redirecting to select_type")
            return jsonify({"success": True, "redirect_url": url_for('select_type')})

        # Existing user: Determine organization and redirect
        if ngo:
            session["email"] = ngo.email
            session["name"] = ngo.name
            session["organization"] = "ngo"
            redirect_url = url_for('dashboard')
            print("🏠 Existing NGO user, redirecting to dashboard")
        elif restaurant:
            session["email"] = restaurant.email
            session["name"] = restaurant.name
            session["organization"] = "restaurant"
            redirect_url = url_for('restaurant_dashboard')
            print("🏠 Existing Restaurant user, redirecting to restaurant_dashboard")

        return jsonify({"success": True, "redirect_url": redirect_url})

    except Exception as e:
        print("🔥 Error in Firebase verification:", str(e))
        return jsonify({"success": False, "message": f"Firebase error: {str(e)}"}), 401

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
        # Check both tables
        user = NGO.query.filter_by(email=email).first() or Restaurant.query.filter_by(email=email).first()

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
        email = s.loads(token, salt='password-reset', max_age=1800)  # Decode token to get email
    except:
        flash('Invalid or expired token', 'error')
        return redirect(url_for('forgot_password'))

    if form.validate_on_submit():
        new_password = form.new_password.data  # Get validated password
        
        # Check both NGO and Restaurant tables
        ngo = NGO.query.filter_by(email=email).first()
        restaurant = Restaurant.query.filter_by(email=email).first()

        # Determine which user to update
        if ngo:
            user = ngo
        elif restaurant:
            user = restaurant
        else:
            flash('User not found', 'error')
            return redirect(url_for('forgot_password'))

        # Update the password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user.password = hashed_password
        db.session.commit()

        flash('Your password has been updated successfully!', 'success')
        return redirect(url_for('login'))

    return render_template('reset_pass.html', form=form, token=token)





# Run the app
if __name__ == '__main__':
    app.run(debug=True)
