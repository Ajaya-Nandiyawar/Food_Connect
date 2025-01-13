from flask import Flask, request, session, render_template, redirect
from flask_sqlalchemy import SQLAlchemy
import bcrypt

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Set a secret key for sessions
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    organization = db.Column(db.String(50), nullable=False)
    
    def __init__(self, name, email, password, organization):
        self.name = name
        self.organization = organization
        self.email = email
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password)


with app.app_context():
    db.create_all()

@app.route('/')
def hello_world():
    return 'Hello, World!'


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

if __name__ == '__main__':
    app.run(debug=True)
