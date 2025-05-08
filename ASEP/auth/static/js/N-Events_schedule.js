document.addEventListener("DOMContentLoaded", () => {
  const eventForm = document.getElementById("eventForm");
  const eventsList = document.getElementById("eventsList");
  const csrfToken =
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") || "";

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
                      <p>Focus: ${event.focus_area}</p>
                      <p>Volunteers Needed: ${event.volunteers_needed}</p>
                      <p>Date: ${event.event_date}</p>
                      <p>Time: ${event.start_time} - ${event.end_time}</p>
                      <p>Location: ${event.location}</p>
                      <p>Phone: ${event.phone_number}</p>
                      <p>Description: ${event.description}</p>
                      <p>Status: ${event.status}</p>
                      <button class="delete-btn" data-id="${event.id}">Delete</button>
                      <button class="view-volunteers-btn" data-id="${event.id}">View Volunteers</button>
                      <div class="volunteers-list" id="volunteers-${event.id}" style="display: none;"></div>
                  `;
          eventsList.appendChild(eventItem);

          // Add event listener for view volunteers button
          const viewButton = eventItem.querySelector(".view-volunteers-btn");
          viewButton.addEventListener("click", () => fetchVolunteers(event.id));
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

  // Fetch and display volunteers for an event
  function fetchVolunteers(eventId) {
    console.log(`Fetching volunteers for event ${eventId}...`);
    const volunteersList = document.getElementById(`volunteers-${eventId}`);
    if (!volunteersList) {
      console.error(`Volunteers list for event ${eventId} not found.`);
      return;
    }
    fetch(`/ngo/events/${eventId}/applications`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
    })
      .then((response) => {
        console.log("Volunteers response status:", response.status);
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(
              `HTTP error! Status: ${response.status}, Response: ${text}`
            );
          });
        }
        return response.json();
      })
      .then((volunteers) => {
        console.log("Received volunteers:", volunteers);
        volunteersList.style.display =
          volunteersList.style.display === "none" ? "block" : "none";
        if (volunteers.length === 0) {
          volunteersList.innerHTML = "<p>No volunteers applied yet.</p>";
          return;
        }
        volunteersList.innerHTML = "<h4>Volunteers:</h4>";
        volunteers.forEach((volunteer) => {
          const volunteerItem = document.createElement("div");
          volunteerItem.className = "volunteer-item";
          volunteerItem.innerHTML = `
                      <p>Name: ${volunteer.name}</p>
                      <p>Email: ${volunteer.Email}</p>
                      <p>Phone: ${volunteer.phone}</p>
                      <p>City: ${volunteer.City}</p>
                      <p>Availability: ${volunteer.availability || "N/A"}</p>
                      <p>Reason: ${volunteer.reason || "N/A"}</p>
                      <p>Status: ${volunteer.status}</p>
                      <button class="status-btn" data-id="${
                        volunteer.id
                      }" data-status="Accepted">Accept</button>
                      <button class="status-btn" data-id="${
                        volunteer.id
                      }" data-status="Rejected">Reject</button>
                  `;
          volunteersList.appendChild(volunteerItem);
        });

        // Add status update listeners
        volunteersList.querySelectorAll(".status-btn").forEach((button) => {
          button.addEventListener("click", () =>
            updateVolunteerStatus(button.dataset.id, button.dataset.status)
          );
        });
      })
      .catch((error) => {
        console.error(`Error fetching volunteers for event ${eventId}:`, error);
        volunteersList.innerHTML = `<p>Failed to load volunteers: ${error.message}</p>`;
      });
  }

  // Update volunteer application status
  function updateVolunteerStatus(applicationId, status) {
    console.log(
      `Updating status for application ${applicationId} to ${status}`
    );
    fetch(`/ngo/volunteer_applications/${applicationId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ status }),
    })
      .then((response) => {
        console.log("Status update response status:", response.status);
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
        console.log("Status update response:", data);
        if (data.status === "success") {
          alert(`Application ${status} successfully!`);
          fetchEvents(); // Refresh to update volunteer lists
        } else {
          alert(data.message);
        }
      })
      .catch((error) => {
        console.error("Error updating status:", error);
        alert(`Failed to update status: ${error.message}`);
      });
  }

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

