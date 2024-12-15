<<<<<<< Updated upstream
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    const password = this.querySelector('input[type="password"]').value;

    // Here you would typically send the email and password to your server for authentication
    // For demonstration, we'll just show an alert
    if (email && password) {
        alert('Login successful!
=======
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');
  
  if (!email || !password) {
      this.classList.add('shake');
      errorMessage.style.display = 'block';
      setTimeout(() => this.classList.remove('shake'), 500);
      return;
  }
  
  // Simulate login - In real implementation, this would be an API call
  console.log('Login attempted with:', { email });
  
  // Clear form
  this.reset();
  errorMessage.style.display = 'none';
});

// Add focus effects to inputs
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
  input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
  });
  
  input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
  });
});
>>>>>>> Stashed changes
