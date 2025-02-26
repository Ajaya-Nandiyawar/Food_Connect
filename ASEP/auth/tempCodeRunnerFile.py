
app.register_blueprint(ngo_blueprint, url_prefix='/ngo')
mail = Mail(app)
app.register_blueprint(notifications_bp, url_prefix='/notifications')
app.register_blueprint(restaurant_blueprint, url_prefix='/Restaurant')

# Initialize SQLAlchemy with the app
db.init_app(app)