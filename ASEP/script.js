document.getElementById('form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Thank you for signing up! Your support makes a difference.');
    this.reset();
});

document.getElementById('subscribe-button').addEventListener('click', function() {
    const email = document.querySelector('footer input[type="email"]').value;
    if (email) {
        alert('Thank you for subscribing! Stay tuned for updates.');
        document.querySelector('footer input[type="email"]').value = '';
    } else {
        alert('Please enter a valid email address.');
    }
});