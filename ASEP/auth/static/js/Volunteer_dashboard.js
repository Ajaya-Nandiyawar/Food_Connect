const notificationIcon = document.querySelector(".notification-icon");
const popup = document.getElementById("notificationPopup");
const list = document.getElementById("notificationList");
const noNotifications = document.getElementById("noNotifications");
const eventsGrid = document.getElementById("eventsGrid");
const signupPopup = document.getElementById("signupPopup");
const joinForm = document.getElementById("joinForm");
const csrfToken =
  document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ||
  "";

// Log volunteerId from global scope
console.log("Volunteer ID from JS:", window.volunteerId || 0);

function togglePopup() {
  const isVisible = popup.style.display === "block";
  popup.style.display = isVisible ? "none" : "block";

  const container = document.querySelector(".container");
  if (!isVisible) {
    container.classList.add("blurred");
  } else {
    container.classList.remove("blurred");
  }

  if (list.children.length === 0) {
    noNotifications.style.display = "block";
  } else {
    noNotifications.style.display = "none";
  }
}
notificationIcon.addEventListener("click", togglePopup);

function toggleSignup() {
  const isVisible = signupPopup.style.display === "block";
  signupPopup.style.display = isVisible ? "none" : "block";

  const container = document.querySelector(".container");
  if (!isVisible) {
    container.classList.add("blurred");
  } else {
    container.classList.remove("blurred");
  }

  if (!isVisible) {
    joinForm.reset();
  }
}

async function fetchEvents(retryCount = 3, delay = 1000) {
  console.log("Fetching events from /ngo/events...");
  console.log("CSRF Token:", csrfToken ? "Present" : "Missing");

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const response = await fetch("/ngo/events", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
      });

      console.log(`Attempt ${attempt} - Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `HTTP error! Status: ${response.status}, Response: ${errorText}`
        );
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const events = await response.json();
      console.log("Received events:", events);

      if (!Array.isArray(events)) {
        console.error("Response is not an array:", events);
        eventsGrid.innerHTML =
          "<p>Invalid server response. Please try again later.</p>";
        return;
      }

      if (events.length === 0) {
        eventsGrid.innerHTML = "<p>No events available at the moment.</p>";
        return;
      }

      renderEvents(events);
      return;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt < retryCount) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        eventsGrid.innerHTML = `<p>Failed to load events: ${error.message}. Please refresh the page or contact support.</p>`;
      }
    }
  }
}

function renderEvents(events) {
  eventsGrid.innerHTML = "";
  events.forEach((event) => {
    console.log("Processing event:", event);
    fetch(`/ngo/events/${event.id}/applications`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
    })
      .then((response) => {
        if (!response.ok) {
          console.warn(
            `Failed to fetch applications for event ${event.id}: ${response.status}`
          );
          return [];
        }
        return response.json();
      })
      .then((applications) => {
        const application = applications.find(
          (app) => app.volunteer_id === parseInt(window.volunteerId)
        );
        const status = application ? application.status : "Not Applied";

        const card = document.createElement("div");
        card.className = "ngo-card";
        card.innerHTML = `
                    <div class="ngo-image">
                        <img src="/static/img/vol_card_3.svg" alt="Event">
                    </div>
                    <div class="ngo-info">
                        <div class="ngo-header">
                            <h3>${event.name}</h3>
                            <span class="impact">${
                              event.volunteers_needed
                            }</span>
                            <span class="status-label" style="font-size: 12px; color: #1877f2;">${status}</span>
                        </div>
                        <p class="focus-area">Focus: ${event.focus_area}</p>
                        <p class="data">📍 ${event.location}</p>
                        <p class="data">📅 ${event.event_date}</p>
                        <p class="data">🕒 ${event.start_time} to ${
          event.end_time
        }</p>
                        <p class="data">📞 ${event.phone_number}</p>
                        ${
                          event.status === "Active" && status === "Not Applied"
                            ? `<button class="partner-btn" onclick="applyForEvent(${event.id}, '${event.name}')">Apply</button>`
                            : ""
                        }
                    </div>
                `;
        eventsGrid.appendChild(card);
      })
      .catch((error) => {
        console.error(
          `Error fetching applications for event ${event.id}:`,
          error
        );
        const card = document.createElement("div");
        card.className = "ngo-card";
        card.innerHTML = `
                    <div class="ngo-image">
                        <img src="/static/img/vol_card_1.svg" alt="Event">
                    </div>
                    <div class="ngo-info">
                        <div class="ngo-header">
                            <h3>${event.name}</h3>
                            <span class="impact">${
                              event.volunteers_needed
                            }</span>
                            <span class="status-label" style="font-size: 12px; color: #1877f2;">Not Applied</span>
                        </div>
                        <p class="focus-area">Focus: ${event.focus_area}</p>
                        <p class="data">📍 ${event.location}</p>
                        <p class="data">📅 ${event.event_date}</p>
                        <p class="data">🕒 ${event.start_time} to ${
          event.end_time
        }</p>
                        <p class="data">📞 ${event.phone_number}</p>
                        ${
                          event.status === "Active"
                            ? `<button class="partner-btn" onclick="applyForEvent(${event.id}, '${event.name}')">Apply</button>`
                            : ""
                        }
                    </div>
                `;
        eventsGrid.appendChild(card);
      });
  });
}

function applyForEvent(eventId, eventName) {
  console.log(
    "Opening application form for event:",
    eventId,
    "Volunteer ID:",
    window.volunteerId
  );
  document.getElementById("eventId").value = eventId;
  document.getElementById("eventName").value = eventName;
  signupPopup.style.display = "block";
  const container = document.querySelector(".container");
  container.classList.add("blurred");
}

joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(joinForm);
  const data = {
    event_id: formData.get("event_id"),
    volunteer_id: window.volunteerId,
    name: formData.get("name"),
    Email: formData.get("Email"),
    phone: formData.get("phone"),
    City: formData.get("City"),
    event: formData.get("event"),
    availability: formData.get("availability") || "",
    reason: formData.get("reason") || "",
  };

  console.log("Form data being sent:", data);

  // Check for missing fields
  for (const [key, value] of Object.entries(data)) {
    if (!value) {
      console.warn(`Missing value for field: ${key}`);
    }
  }

  try {
    const response = await fetch("/ngo/volunteer_applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(data),
    });

    console.log("Application response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `HTTP error! Status: ${response.status}, Response: ${errorText}`
      );
      throw new Error(`HTTP error! Status: ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("Application response:", result);

    if (result.status === "success") {
      signupPopup.style.display = "none";
      joinForm.reset();
      const container = document.querySelector(".container");
      container.classList.remove("blurred");
      fetchEvents();
      alert("Application submitted successfully!");
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error("Error submitting application:", error);
    alert("Failed to submit application: " + error.message);
  }
});

fetchEvents();
