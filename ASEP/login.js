document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    const password = this.querySelector('input[type="password"]').value;

    // Here you would typically send the email and password to your server for authentication
    // For demonstration, we'll just show an alert
    if (email && password) {
        alert('Login successful!