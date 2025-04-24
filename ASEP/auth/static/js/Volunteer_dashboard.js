const notificationIcon = document.querySelector('.notification-icon');
const popup = document.getElementById('notificationPopup');
const list = document.getElementById('notificationList');
const noNotifications = document.getElementById('noNotifications');

function togglePopup() {
  const isVisible = popup.style.display === 'block';
  popup.style.display = isVisible ? 'none' : 'block';

  const container = document.querySelector('.container');
  if (!isVisible) {
    container.classList.add('blurred');
  } else {
    container.classList.remove('blurred');
  }

  if (list.children.length === 0) {
    noNotifications.style.display = 'block';
  } else {
    noNotifications.style.display = 'none';
  }
}
notificationIcon.addEventListener('click', togglePopup);
