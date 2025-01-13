from flask import Flask, request, session, render_template, redirect
from flask_sqlalchemy import SQLAlchemy
import bcrypt

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Set a secret key for sessions

# MySQL connection string
db_user = "root"
db_password = "Rishi%400211"  # URL-encoded password (%40 represents @)
db_host = "127.0.0.1"
db_name = "food_sharing"

# Configuring database URI
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking

# Initialize SQLAlchemy
db = SQLAlchemy(app)

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

# Create database tables
with app.app_context():
    db.create_all()

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
        return render_template('dashboard.html', name=session['name'], organization=session['organization'])
    return redirect('/login')

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
