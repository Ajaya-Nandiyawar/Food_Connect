document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settings-form');
    const cancelBtn = document.querySelector('.cancel-btn');
    const logoutBtn = document.querySelector('.logout-btn');
    const editImageBtn = document.querySelector('.edit-image');
    const navLinks = document.querySelectorAll('.nav-links li');

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Simulate saving changes
        showNotification('Changes saved successfully!', 'success');
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to discard changes?')) {
            form.reset();
        }
    });

    // Logout button
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            // Add logout logic here
            console.log('Logging out...');
        }
    });

    // Edit profile image
    editImageBtn.addEventListener('click', () => {
        // Simulate file input click
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.click();

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Handle image upload
                console.log('Uploading image:', file.name);
                showNotification('Profile image updated!', 'success');
            }
        });
    });

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            document.querySelector('.nav-links li.active')?.classList.remove('active');
            link.classList.add('active');
            // Add navigation logic here
            console.log('Navigating to:', link.textContent.trim());
        });
    });

    // Form validation
    const inputs = form.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('invalid', (e) => {
            e.preventDefault();
            showNotification('Please fill in all required fields.', 'error');
        });
    });

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '4px',
            backgroundColor: type === 'success' ? '#34a853' : '#d93025',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: '1000',
            animation: 'slideIn 0.3s ease-out'
        });

        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
});

export function setupCounter(element) {
    let counter = 0
    const setCounter = (count) => {
      counter = count
      element.innerHTML = `count is ${counter}`
    }
    element.addEventListener('click', () => setCounter(counter + 1))
    setCounter(0)
  }
  