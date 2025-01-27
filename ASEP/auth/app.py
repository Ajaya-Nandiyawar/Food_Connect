from flask import Flask, request, session, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from extensions import db
import bcrypt, os
from NGO import ngo_blueprint

# Initialize the Flask app
app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Set a secret key for sessions

# MySQL connection string
db_user = "root"
db_password = "%40J%21nky%40ub%40le5"  # URL-encoded password (%40 represents @)
db_host = "127.0.0.1"
db_name = "registered"

# Configuring database URI
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking


# Register blueprint before app initialization (if using blueprints)
app.register_blueprint(ngo_blueprint, url_prefix='/ngo')

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

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            session['name'] = user.name
            session['email'] = user.email
            session['organization'] = user.organization
            return redirect('/dashboard')
        else:
            return 'Invalid email or password'
    
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        organization = request.form['organization']
        
        # Check if the email already exists
        if User.query.filter_by(email=email).first():
            return 'Email already registered'

        # Create and save the new user
        new_user = User(name=name, email=email, password=password, organization=organization)
        db.session.add(new_user)    
        db.session.commit()
        
        return redirect('/login')
    
    return render_template('signup.html')

@app.route('/dashboard')
def dashboard():
    if 'name' in session and 'email' in session and 'organization' in session:
        api_key = os.getenv('AIzaSyA083VfuQXN3YIRY_uMmjldA8VhjIat5FE')  # Store the key as an environment variable
        return render_template('dashboard2.html', name=session['name'], organization=session['organization'] , api_key=api_key) 
    return redirect('/login')
    

@app.route('/profile', methods=['GET'])
def profile():
    if request.method == 'GET' and 'email' in session:
        user = User.query.filter_by(email=session['email']).first()
        if user:
            return render_template(
            'settings.html',
            name=user.name,
            email=user.email
        )
    return redirect('/login')

@app.route('/notifications')
def notifications():
    return render_template('notification.html')

@app.route('/stat')
def stat():
    return render_template('stats.html')




# Run the app
if __name__ == '__main__':
    app.run(debug=True)
