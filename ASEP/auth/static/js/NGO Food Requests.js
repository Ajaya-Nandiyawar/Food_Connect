document.addEventListener("DOMContentLoaded", () => {
  const acceptButtons = document.querySelectorAll(".accept-btn");

  acceptButtons.forEach(button => {
    button.addEventListener("click", async () => {
      const requestId = button.getAttribute("data-id");
      const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

      try {
        const response = await fetch(`/update_request_status/${requestId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({ status: "Accepted" }),
        });

        const data = await response.json();
        if (data.success) {
          const card = button.closest(".request-card");
          const statusSpan = card.querySelector(".status");
          statusSpan.textContent = "Accepted";
          statusSpan.className = "status accepted"; // Matches template logic
          button.disabled = true;
          button.textContent = "Accepted";

          setTimeout(() => {
            card.remove();
          }, 1800000); // 30 minutes

          alert("Request accepted successfully!");
        } else {
          alert("Failed to accept request: " + data.message);
        }
      } catch (error) {
        console.error("Error accepting request:", error);
        alert("An error occurred while accepting the request.");
      }
  });
});

  // Optional: Add filter functionality (for status, food type, date)
  const applyFiltersBtn = document.querySelector(".apply-filters");
  applyFiltersBtn.addEventListener("click", () => {
    const statusFilter = document
      .getElementById("status-filter")
      .value.toLowerCase();
    const foodTypeFilter = document
      .getElementById("food-type-filter")
      .value.toLowerCase();
    const dateFilter = document.getElementById("date-filter").value;

    document.querySelectorAll(".request-card").forEach((card) => {
      const status = card.querySelector(".status").textContent.toLowerCase();
      const foodType = card
        .querySelector(".requirements li:first-child")
        .textContent.toLowerCase()
        .replace("food type: ", "");
      const pickupDate = card
        .querySelector(".requirements li:nth-child(3)")
        .textContent.replace("Pickup Date:", "")
        .trim();

      const statusMatch = statusFilter === "all" || status === statusFilter;
      const foodTypeMatch =
        foodTypeFilter === "all" || foodType.includes(foodTypeFilter);
      const dateMatch = !dateFilter || pickupDate === dateFilter;

      card.style.display =
        statusMatch && foodTypeMatch && dateMatch ? "block" : "none";
    });
  });
});
