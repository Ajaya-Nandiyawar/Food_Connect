document.addEventListener("DOMContentLoaded", () => {
  fetchNotifications();
  setInterval(fetchNotifications, 10000); // Refresh every 10 seconds
});

function fetchNotifications() {
  console.log("Fetching notifications...");
  fetch("/notifications/api/notifications")
    .then((response) => {
      console.log("Response status:", response.status);
      if (!response.ok) throw new Error("Fetch failed");
      return response.json();
    })
    .then((data) => {
      console.log("Fetched data:", data);
      const content = document.getElementById("notificationsContent");
      const section = content.querySelector(".section");
      section.innerHTML = "<h2>Recent Notifications</h2>";

      if (data.length === 0) {
        section.innerHTML += "<p>No notifications available.</p>";
      } else {
        data.forEach((notif) => {
          const div = document.createElement("div");
          div.className = "notification info";
          div.innerHTML = `
            <div class="notification-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar" viewBox="0 0 16 16">
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                </svg>
            </div>
              <div class="notification-content">
                <div class="notification-header">
                  <h3>${notif.message}</h3>
                  <span class="time">${new Date(
                    notif.created_at
                  ).toLocaleString()}</span>
                </div>
                <p>Food Type: ${notif.food_type}, Quantity: ${
            notif.quantity
          }</p>
                <p>Note: ${notif.additional_note || "None"}</p>
                <button class="delete-btn" onclick="deleteNotification(${
                  notif.id
                })">Delete</button>
              </div>
            `;
          section.appendChild(div);
        });
      }
    })
    .catch((error) => console.error("Error fetching notifications:", error));
}

function deleteNotification(notificationId) {
  if (confirm("Are you sure you want to delete this notification?")) {
    fetch(`/notifications/api/notifications/delete/${notificationId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": document.querySelector('meta[name="csrf-token"]')
          .content, // Include CSRF token
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Delete failed");
        return response.json();
      })
      .then((data) => {
        console.log("Delete response:", data);
        if (data.status === "success") {
          alert(data.message);
          fetchNotifications(); // Refresh the list after deletion
        } else {
          alert("Error: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error deleting notification:", error);
        alert("Failed to delete notification");
      });
  }
}
