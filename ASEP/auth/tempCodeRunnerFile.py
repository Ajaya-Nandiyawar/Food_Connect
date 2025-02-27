<<<<<<< HEAD
# Replace with your actual API key
=======

app.register_blueprint(ngo_blueprint, url_prefix='/ngo')
mail = Mail(app)
app.register_blueprint(notifications_bp, url_prefix='/notifications')
app.register_blueprint(restaurant_blueprint, url_prefix='/Restaurant')

# Initialize SQLAlchemy with the app
db.init_app(app)
>>>>>>> 5e54648a2e89426275c06b8320e06ec1e2243cb4
