function fetchNotifications() {
  fetch("/notifications/api/notifications")
    .then((response) => {
      if (!response.ok) throw new Error("Fetch failed");
      return response.json();
    })
    .then((data) => {
      list.innerHTML = ""; // Clear existing notifications
      if (data.length === 0) {
        noNotifications.style.display = "block";
      } else {
        noNotifications.style.display = "none";
        data.forEach((notif) => {
          const li = document.createElement("li");
          li.innerHTML = `
              <strong>${notif.message}</strong><br>
              Food Type: ${notif.food_type}, Quantity: ${notif.quantity}<br>
              Note: ${notif.additional_note || "None"}<br>
              <small>${new Date(notif.created_at).toLocaleString()}</small><br>
              <button class="btn-link" onclick="deleteNotification(${
                notif.id
              })">Delete</button>
            `;
          list.appendChild(li);
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching notifications:", error);
      noNotifications.style.display = "block";
      list.innerHTML = "";
    });
}

// Delete notification
function deleteNotification(notificationId) {
  if (confirm("Are you sure you want to delete this notification?")) {
    fetch(`/notifications/api/notifications/delete/${notificationId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken":
          document.querySelector('meta[name="csrf-token"]')?.content || "",
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Delete failed");
        return response.json();
      })
      .then((data) => {
        if (data.status === "success") {
          alert(data.message);
          fetchNotifications(); // Refresh notifications
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

// Fetch notifications every 10 seconds
setInterval(fetchNotifications, 10000);

(function () {
  function c() {
    var b = a.contentDocument || a.contentWindow.document;
    if (b) {
      var d = b.createElement("script");
      d.innerHTML =
        "window.__CF$cv$params={r:'9335954c9c42676f',t:'MTc0NTE2MTk4MC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
      b.getElementsByTagName("head")[0].appendChild(d);
    }
  }
  if (document.body) {
    var a = document.createElement("iframe");
    a.height = 1;
    a.width = 1;
    a.style.position = "absolute";
    a.style.top = 0;
    a.style.left = 0;
    a.style.border = "none";
    a.style.visibility = "hidden";
    document.body.appendChild(a);
    if ("loading" !== document.readyState) c();
    else if (window.addEventListener)
      document.addEventListener("DOMContentLoaded", c);
    else {
      var e = document.onreadystatechange || function () {};
      document.onreadystatechange = function (b) {
        e(b);
        "loading" !== document.readyState &&
          ((document.onreadystatechange = e), c());
      };
    }
  }
})();
