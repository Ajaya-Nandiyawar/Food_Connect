from flask import Flask, request, session, render_template, redirect, url_for

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('application_form.html')

if __name__ == '__main__':
    app.run(debug=True)