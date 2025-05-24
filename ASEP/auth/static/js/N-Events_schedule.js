document.addEventListener("DOMContentLoaded", () => {
  const eventForm = document.getElementById("eventForm");
  const eventsList = document.getElementById("eventsList");
  const csrfToken =
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") || "";

  // Modal elements
  const modal = document.getElementById('modal');
  const overlay = document.getElementById('overlay');
  const applicationsList = document.getElementById('applicationsList');
  let currentEventId = null; // Track which event's volunteers are being viewed

  // Track current status filter and volunteers data
  let currentStatusFilter = "All";
  let currentVolunteersData = [];

  if (!eventsList) {
    console.error(
      'Events list element not found. Ensure <div id="eventsList"> exists in the HTML.'
    );
    return;
  }

  if (!eventForm) {
    console.error(
      'Event form not found. Ensure <form id="eventForm"> exists in the HTML.'
    );
    return;
  }

  // Fetch and display events
  function fetchEvents() {
    console.log("Fetching events...");
    fetch("/ngo/events", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
    })
      .then((response) => {
        console.log("Events response status:", response.status);
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(
              `HTTP error! Status: ${response.status}, Response: ${text}`
            );
          });
        }
        return response.json();
      })
      .then((events) => {
        console.log("Received events:", JSON.stringify(events, null, 2));
        eventsList.innerHTML = "";
        if (!Array.isArray(events) || events.length === 0) {
          console.warn("No events returned from server.");
          eventsList.innerHTML = "<p>No events scheduled.</p>";
          return;
        }
        events.forEach((event) => {
          console.log("Rendering event:", event.name);
          const eventItem = document.createElement("div");
          eventItem.className = "event-item";
          eventItem.innerHTML = `
            <h3>${event.name}</h3>
            <div class="event-row">
              <p><strong>Focus:</strong> ${event.focus_area}</p>
              <p><strong>Volunteers:</strong> ${event.volunteers_needed}</p>
            </div>
            <div class="event-row">
              <p><strong>Date:</strong> ${event.event_date}</p>
              <p><strong>Time:</strong> ${event.start_time} - ${event.end_time}</p>
            </div>
            <div class="event-row">
              <p><strong>Location:</strong> ${event.location}</p>
              <p><strong>Phone:</strong> ${event.phone_number}</p>
            </div>
            <p><strong>Description:</strong> ${event.description}</p>
            <p class="status-badge status-${event.status}"><strong>Status:</strong> ${event.status}</p>
            <div class="event-actions">
              <button class="delete-btn" data-id="${event.id}">Delete</button>
              <button class="view-volunteers-btn" data-id="${event.id}">View Volunteers</button>
            </div>
          `;
          eventsList.appendChild(eventItem);

          // Add event listener for view volunteers button
          const viewButton = eventItem.querySelector(".view-volunteers-btn");
          viewButton.addEventListener("click", () => {
            currentEventId = event.id; // Store the current event ID
            fetchVolunteers(event.id);
          });
        });

        // Add delete event listeners
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", () =>
            deleteEvent(button.dataset.id)
          );
        });
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        eventsList.innerHTML = `<p>Failed to load events: ${error.message}</p>`;
      });
  }



  // Fetch and display volunteers for an event in modal
  function fetchVolunteers(eventId) {
    console.log(`Fetching volunteers for event ${eventId}...`);
    currentEventId = eventId;
    
    // Show modal and overlay
    modal.style.display = 'flex';
    overlay.style.display = 'block';
    
    // Set loading state
    applicationsList.innerHTML = '<p>Loading volunteers...</p>';
    
    fetch(`/ngo/events/${eventId}/applications`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((volunteers) => {
        console.log("Received volunteers:", volunteers);
        currentVolunteersData = volunteers; // Store the original data
        
        if (volunteers.length === 0) {
          applicationsList.innerHTML = '<p>No volunteers applied yet.</p>';
          return;
        }
        
        renderVolunteers(volunteers);
      })
      .catch((error) => {
        console.error(`Error fetching volunteers for event ${eventId}:`, error);
        applicationsList.innerHTML = `<p class="error">Failed to load volunteers: ${error.message}</p>`;
      });
  }

  function renderVolunteers(volunteers) {
    applicationsList.innerHTML = '';
    
    const filteredVolunteers = currentStatusFilter === "All" 
      ? volunteers 
      : volunteers.filter(v => v.status === currentStatusFilter);
    
    if (filteredVolunteers.length === 0) {
      applicationsList.innerHTML = `<p>No ${currentStatusFilter.toLowerCase()} volunteers.</p>`;
      return;
    }

    filteredVolunteers.forEach((volunteer) => {
      const volunteerCard = document.createElement('div');
      volunteerCard.className = 'volunteer-card';
      volunteerCard.innerHTML = `
        <div class="volunteer-card-header">
          <div>
            <span class="volunteer-id">ID: ${volunteer.id}</span>
            <h4 class="volunteer-name">${volunteer.name}</h4>
          </div>
          <div class="volunteer-actions" id="actions-${volunteer.id}">
            ${volunteer.status === 'Pending' ? `
              <button class="btn-approve" data-id="${volunteer.id}">Approve</button>
              <button class="btn-decline" data-id="${volunteer.id}">Decline</button>
            ` : ''}
            <button class="btn-view" data-id="${volunteer.id}">
              ${volunteer.status !== 'Pending' ? 'View Details' : 'View More'}
            </button>
          </div>
        </div>
        <div class="volunteer-details" id="details-${volunteer.id}">
          <p><strong>Email:</strong> ${volunteer.Email || 'N/A'}</p>
          <p><strong>Phone:</strong> ${volunteer.phone || 'N/A'}</p>
          <p><strong>City:</strong> ${volunteer.City || 'N/A'}</p>
          <p><strong>Availability:</strong> ${volunteer.availability || 'N/A'}</p>
          <p><strong>Reason:</strong> ${volunteer.reason || 'N/A'}</p>
          <p><strong>Status:</strong> ${volunteer.status || 'Pending'}</p>
        </div>
      `;
      applicationsList.appendChild(volunteerCard);
      
      // Add click handler for view more button
      const viewButton = volunteerCard.querySelector('.btn-view');
      viewButton.addEventListener('click', () => {
        const details = document.getElementById(`details-${volunteer.id}`);
        details.classList.toggle('show');
        viewButton.textContent = details.classList.contains('show') 
          ? 'View Less' 
          : (volunteer.status !== 'Pending' ? 'View Details' : 'View More');
      });
      
      // Add click handlers for approve/decline buttons if they exist
      const approveButton = volunteerCard.querySelector('.btn-approve');
      const declineButton = volunteerCard.querySelector('.btn-decline');
      
      if (approveButton) {
        approveButton.addEventListener('click', () => updateVolunteerStatus(volunteer.id, 'Approved'));
      }
      if (declineButton) {
        declineButton.addEventListener('click', () => updateVolunteerStatus(volunteer.id, 'Declined'));
      }
    });
  }

  // Update volunteer application status
  function updateVolunteerStatus(applicationId, status) {
    console.log(`Updating status for application ${applicationId} to ${status}`);
    
    fetch(`/ngo/volunteer_applications/${applicationId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ status }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        if (data.status === "success") {
          // Update the local data
          const volunteerIndex = currentVolunteersData.findIndex(v => v.id == applicationId);
          if (volunteerIndex !== -1) {
            currentVolunteersData[volunteerIndex].status = status;
          }
          
          // Re-render with current filter
          renderVolunteers(currentVolunteersData);
          
          // Show success message
          const statusMessage = document.createElement('div');
          statusMessage.className = 'status-message success';
          statusMessage.textContent = `Application ${status} successfully!`;
          document.body.appendChild(statusMessage);
          setTimeout(() => statusMessage.remove(), 3000);
        } else {
          alert(data.message);
        }
      })
      .catch((error) => {
        console.error("Error updating status:", error);
        alert(`Failed to update status: ${error.message}`);
      });
  }

  // Close modal function
  function closeModal() {
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  }

  // Add event listener for overlay click
  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  // Add event listener for close button
  const closeButton = document.querySelector('.modal-footer .btn');
  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  // Add tab switching functionality
  document.querySelectorAll('.status-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      this.classList.add('active');
      // Filter volunteers by status
      const status = this.dataset.status;
      filterVolunteersByStatus(status);
    });
  });

  // Filter volunteers by status
  function filterVolunteersByStatus(status) {
    console.log(`Filtering volunteers by status: ${status}`);
    currentStatusFilter = status;
    
    // Update active tab UI
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.status-tab[data-status="${status}"]`).classList.add('active');
    
    // Re-render volunteers with the new filter
    renderVolunteers(currentVolunteersData);
  }

  // Add this CSS for status messages
  const style = document.createElement('style');
  style.textContent = `
    .status-message {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      border-radius: 4px;
      color: white;
      z-index: 2000;
      animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
    }
    .status-message.success {
      background-color: #28a745;
    }
    .status-message.error {
      background-color: #dc3545;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
    }
  `;
document.head.appendChild(style);

// Handle event form submission
eventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(eventForm);
    const data = {
      name: formData.get("name")?.trim() || "",
      focus_area: formData.get("focus_area")?.trim() || "",
      volunteers_needed: parseInt(formData.get("volunteers_needed")) || 0,
      event_date: formData.get("event_date") || "",
      start_time: formData.get("start_time") || "",
      end_time: formData.get("end_time") || "",
      location: formData.get("location")?.trim() || "",
      phone_number: formData.get("phone_number")?.trim() || "",
      description: formData.get("description")?.trim() || "",
    };

    // Validate required fields
    const requiredFields = [
      "name",
      "focus_area",
      "volunteers_needed",
      "event_date",
      "start_time",
      "end_time",
      "location",
      "phone_number",
      "description",
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        alert(`Please fill in the ${field.replace("_", " ")} field.`);
        return;
      }
    }

    if (isNaN(data.volunteers_needed) || data.volunteers_needed < 1) {
      alert("Volunteers needed must be a positive number.");
      return;
    }

    console.log("Submitting event:", JSON.stringify(data, null, 2));

    fetch("/ngo/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);
        return response.text().then((text) => {
          console.log("Response body:", text);
          if (!response.ok) {
            throw new Error(
              `HTTP error! Status: ${response.status}, Response: ${text}`
            );
          }
          return JSON.parse(text);
        });
      })
      .then((data) => {
        console.log("Event creation response:", data);
        if (data.status === "success") {
          eventForm.reset();
          // Add a small delay to ensure DB commit
          setTimeout(() => {
            fetchEvents();
          }, 500);
          alert("Event created successfully!");
        } else {
          alert(data.message);
        }
      })
      .catch((error) => {
        console.error("Error creating event:", error);
        alert(`Failed to create event: ${error.message}`);
      });
  });

  // Delete an event
  function deleteEvent(eventId) {
    console.log(`Deleting event ${eventId}`);
    fetch(`/ngo/events/${eventId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
    })
      .then((response) => {
        console.log("Delete response status:", response.status);
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(
              `HTTP error! Status: ${response.status}, Response: ${text}`
            );
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("Delete response:", data);
        if (data.status === "success") {
          fetchEvents();
          alert("Event deleted successfully!");
        } else {
          alert(data.message);
        }
      })
      .catch((error) => {
        console.error("Error deleting event:", error);
        alert(`Failed to delete event: ${error.message}`);
      });
  }

  // Load events on page load
  fetchEvents();
});