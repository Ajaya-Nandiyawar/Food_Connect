const eventForm = document.getElementById('eventForm');
const eventsContainer = document.getElementById('eventsContainer');
const warning = document.getElementById('warning');
const overlay = document.getElementById('overlay');
const modal = document.getElementById('modal');
const applicationsList = document.getElementById('applicationsList');
const clearBtn = document.getElementById('clearForm');

let events = [];
const MAX_EVENTS = 3;

// Handle form submit
eventForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  if (events.length >= MAX_EVENTS) {
    warning.textContent = 'Maximum 3 active events allowed. Please delete an event first.';
    return;
  }

  const event = {
    name: document.getElementById('eventName').value,
    focusArea: document.getElementById('focusArea').value,
    volunteers: document.getElementById('volunteersNeeded').value,
    date: document.getElementById('eventDate').value,
    startTime: document.getElementById('startTime').value,
    endTime: document.getElementById('endTime').value,
    location: document.getElementById('eventLocation').value,
    phoneNumber: document.getElementById('phoneNumber').value,
    description: document.getElementById('eventDescription').value,
    applications: []
  };
  
  
  events.push(event);
  renderEvents();
  eventForm.reset();
  warning.textContent = '';
});

// Handle clear form button
clearBtn.addEventListener('click', function() {
  eventForm.reset();
  warning.textContent = '';
});

// Render events list
function renderEvents() {
  eventsContainer.innerHTML = '';
  events.forEach((event, index) => {
    const card = document.createElement('div');
    card.className = 'event-card';
    // Update renderEvents function to show new details
    card.innerHTML = `
        <h4>${event.name}</h4>
        <p><strong>Focus Area:</strong> ${event.focusArea}</p>
        <p><strong>Date:</strong> ${event.date}</p>
        <p><strong>Time:</strong> ${event.startTime} to ${event.endTime}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Phone:</strong> ${event.phoneNumber}</p>
        <p><strong>Volunteers Needed:</strong> ${event.volunteers}</p>
        <button class="btn blue" onclick="viewApplications(${index})">View Applications</button>
        <button class="btn red" onclick="deleteEvent(${index})">Delete</button>
    `;

    eventsContainer.appendChild(card);
  });
}

// View applications modal
function viewApplications(index) {
  applicationsList.innerHTML = '';
  if (events[index].applications.length === 0) {
    applicationsList.innerHTML = '<li>No applications yet.</li>';
  } else {
    events[index].applications.forEach(app => {
      const li = document.createElement('li');
      li.textContent = app;
      applicationsList.appendChild(li);
    });
  }
  overlay.style.display = 'block';
  modal.style.display = 'block';
}

// Delete event
function deleteEvent(index) {
  events.splice(index, 1);
  renderEvents();
  warning.textContent = '';
}

// Close modal
function closeModal() {
  overlay.style.display = 'none';
  modal.style.display = 'none';
}
