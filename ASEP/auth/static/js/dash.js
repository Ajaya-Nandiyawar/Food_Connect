// script.js
document.addEventListener('DOMContentLoaded', function() {
    showDialog();
});

// Show dialog function
function showDialog() {
    const dialog = document.getElementById('welcomeDialog');
    // Small delay to ensure smooth animation
    setTimeout(() => {
        dialog.classList.add('active');
    }, 100);
}

// Close dialog function
function closeDialog() {
    const dialog = document.getElementById('welcomeDialog');
    dialog.classList.remove('active');
}

// Handle redirect function
function handleRedirect(path) {
    // Add your routing logic here
    console.log(`Redirecting to: /${path}`);
    closeDialog();
    // Example redirect:
    // window.location.href = `/${path}`;
}

// Show dialog on page refresh
window.addEventListener('load', showDialog);

// Close dialog when clicking outside
document.getElementById('welcomeDialog').addEventListener('click', function(e) {
    if (e.target === this) {
        closeDialog();
    }
});

// Prevent closing when clicking inside dialog content
document.querySelector('.dialog-content').addEventListener('click', function(e) {
    e.stopPropagation();
});

function handleRedirect(path) {
    // Define paths for redirection
    if (path === 'need-food') {
        window.location.href = '/R-guide'; // Redirect to the "Need Food" page
    } else if (path === 'donate-food') {
        window.location.href = '/N-guide'; // Redirect to the "Donate Food" page (if needed)
    }
    closeDialog();
}
