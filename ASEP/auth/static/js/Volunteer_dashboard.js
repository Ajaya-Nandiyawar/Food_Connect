const notificationIcon = document.querySelector('.notification-icon');
const popup = document.getElementById('notificationPopup');
const list = document.getElementById('notificationList');
const noNotifications = document.getElementById('noNotifications');

function togglePopup() {
  popup.style.display = popup.style.display === 'block' ? 'none' : 'block';

  // Show or hide "no notifications" text
  if (list.children.length === 0) {
    noNotifications.style.display = 'block';
  } else {
    noNotifications.style.display = 'none';
  }
}

notificationIcon.addEventListener('click', togglePopup);
