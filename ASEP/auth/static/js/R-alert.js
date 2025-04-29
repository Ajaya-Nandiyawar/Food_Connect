document.addEventListener('DOMContentLoaded', () => {
    // Navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });
});

// Notification Functions
function markAllAsRead() {
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    unreadNotifications.forEach(notification => {
        notification.classList.remove('unread');
    });
}

function clearAll() {
    if (confirm('Are you sure you want to clear all notifications?')) {
        const notificationsList = document.getElementById('notificationsList');
        notificationsList.innerHTML = '<p class="empty-state">No notifications to display</p>';
    }
}

function markAsRead(button) {
    const notificationItem = button.closest('.notification-item');
    notificationItem.classList.remove('unread');
}

function filterNotifications() {
    const filter = document.getElementById('filterNotifications').value;
    const notifications = document.querySelectorAll('.notification-item');
    
    notifications.forEach(notification => {
        switch(filter) {
            case 'unread':
                notification.style.display = notification.classList.contains('unread') ? 'flex' : 'none';
                break;
            case 'requests':
                notification.style.display = notification.querySelector('.notification-icon.request') ? 'flex' : 'none';
                break;
            case 'donations':
                notification.style.display = notification.querySelector('.notification-icon.success') ? 'flex' : 'none';
                break;
            case 'system':
                notification.style.display = notification.querySelector('.notification-icon.system') ? 'flex' : 'none';
                break;
            default:
                notification.style.display = 'flex';
        }
    });
}

// Pagination
document.querySelectorAll('.btn-page').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.btn-page').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

// Get the button element
const scrollToTopButton = document.querySelector('.scroll-to-top-button');

// Show/hide button based on scroll position
window.addEventListener('scroll', () => {
  if (window.scrollY > 100) { // Show button after scrolling 100px
    scrollToTopButton.style.display = 'flex';
  } else {
    scrollToTopButton.style.display = 'none';
  }
});

// Smooth scroll to top when button is clicked
scrollToTopButton.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});