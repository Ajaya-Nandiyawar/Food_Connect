from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = "your_secret_key"

# MySQL Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://app_user:secure_password@localhost/food_sharing_app'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define the User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    organization = db.Column(db.String(50), nullable=False)

# Route to serve the registration page
@app.route('/')
def signup_page():
    return render_template('register.html')

# Route to handle form submission
@app.route('/register', methods=['POST'])
def register():
    try:
        # Extract form data
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        organization = request.form.get('organization')

        # Input validation
        if not name or not email or not password or not organization:
            flash("All fields are required.", "error")
            return redirect(url_for('signup_page'))

        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash("Email already registered.", "error")
            return redirect(url_for('signup_page'))

        # Save data to the database
        new_user = User(name=name, email=email, password=password, organization=organization)
        db.session.add(new_user)
        db.session.commit()

        flash("Registration successful!", "success")
        return redirect(url_for('signup_page'))

    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")
        return redirect(url_for('signup_page'))

if __name__ == '__main__':
    # Create database tables before running the app
    with app.app_context():
        db.create_all()

    app.run(debug=True)
