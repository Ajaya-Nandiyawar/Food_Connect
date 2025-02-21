document.addEventListener("DOMContentLoaded", () => {
  // Handle status changes
  const statusFilter = document.getElementById("status-filter");
  const foodTypeFilter = document.getElementById("food-type-filter");
  const dateFilter = document.getElementById("date-filter");
  const applyFiltersBtn = document.querySelector(".apply-filters");

  // Filter functionality
  applyFiltersBtn.addEventListener("click", () => {
    const filters = {
      status: statusFilter.value,
      foodType: foodTypeFilter.value,
      date: dateFilter.value,
    };
    console.log("Applied filters:", filters);
    // Here you would typically make an API call to fetch filtered results
  });

  // Handle request actions
  document.querySelectorAll(".primary-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".request-card");
      const requestId = card.querySelector(".request-id").textContent;

      if (btn.classList.contains("completed")) {
        console.log(`Marking request ${requestId} as completed`);
        // Add completion logic here
      } else {
        console.log(`Accepting request ${requestId}`);
        // Add acceptance logic here
      }
    });
  });

  // Handle view details
  document.querySelectorAll(".secondary-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".request-card");
      const requestId = card.querySelector(".request-id").textContent;
      console.log(`Viewing details for request ${requestId}`);
      // Add view details logic here
    });
  });

  // Handle pagination
  document.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (!btn.classList.contains("active")) {
        document.querySelector(".page-btn.active")?.classList.remove("active");
        if (!["Previous", "Next"].includes(btn.textContent)) {
          btn.classList.add("active");
        }
        console.log(`Navigating to page: ${btn.textContent}`);
        // Add pagination logic here
      }
    });
  });

  // Handle navigation
  document.querySelectorAll(".nav-links li").forEach((item) => {
    item.addEventListener("click", (e) => {
      document
        .querySelector(".nav-links li.active")
        ?.classList.remove("active");
      item.classList.add("active");
      console.log(`Navigating to: ${item.textContent.trim()}`);
      // Add navigation logic here
    });
  });
});

export function setupCounter(element) {
  let counter = 0;
  const setCounter = (count) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
  };
  element.addEventListener("click", () => setCounter(counter + 1));
  setCounter(0);
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("JavaScript Loaded!");

  document.querySelectorAll(".accept-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const requestId = this.getAttribute("data-id");
      console.log("Accepting request Request ID:", requestId);

      fetch("/ngo/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, status: "Accepted" }),
      })
        .then((response) => {
          console.log("Raw Response:", response); // Check if the response is received
          return response.json();
        })
        .then((data) => {
          console.log("Server Response:", data); // Debugging

          if (data.status === "success") {
            console.log(
              `Status updated to Accepted for Request ID: ${requestId}`
            ); // Debugging
            const statusElement =
              this.closest(".request-card").querySelector(".status");

            if (statusElement) {
              statusElement.innerText = "Accepted";
              statusElement.classList.remove("pending");
              statusElement.classList.add("accepted");
              console.log("UI updated successfully.");
            } else {
              console.error("Status element not found.");
            }
          } else {
            console.error("Error from server:", data.message);
            alert("Failed to update request status: " + data.message);
          }
        })
        .catch((error) => {
          console.error("Fetch error:", error);
          alert("Failed to connect to the server. Check console for details.");
        });
    });
  });
});
