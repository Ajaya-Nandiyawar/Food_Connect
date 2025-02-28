document.addEventListener("DOMContentLoaded", () => {
  // Initialize Mapbox Geocoder
  mapboxgl.accessToken =
    "pk.eyJ1IjoidGhlLWRlc3Ryb3llciIsImEiOiJjbTdkbWd1ZjIwMDJ3MmpxdXp3dWNpb3VlIn0.GtirZBfgEJOCgwsM9ZB0Zg";
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: "Enter pickup location",
  });

  geocoder.addTo("#geocoder");

  // Update hidden location input when a result is selected
  geocoder.on("result", (e) => {
    document.getElementById("location").value = e.result.place_name;
  });

  // Form submission handling for create and update
  const donationForm = document.getElementById("donationForm");
  const submitButton = document.querySelector(".Create_Donation");
  const editButtons = document.querySelectorAll(".edit-btn");
  const cancelButtons = document.querySelectorAll(".cancel-btn");
  let isSubmitting = false;
  let isEditing = false;
  let currentDonationId = null;

  donationForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) return;
    isSubmitting = true;

    submitButton.disabled = true;
    submitButton.textContent = isEditing ? "Updating..." : "Submitting...";

    const formData = {
      food_type: document.getElementById("foodType").value,
      quantity: document.getElementById("quantity").value,
      unit: document.getElementById("unit").value,
      expiry_date: document.getElementById("expiryDate").value,
      pickup_time: document.getElementById("pickupTime").value,
      location: document.getElementById("location").value,
      phone: document.getElementById("phone").value,
      special_instructions: document.getElementById("instructions").value,
    };

    try {
      const url = isEditing
        ? `/Restaurant/donation/${currentDonationId}`
        : "/Restaurant/donation";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": document.querySelector('meta[name="csrf-token"]')
            .content,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        alert(data.message);
        window.location.reload(); // Reload to refresh the table
      } else {
        throw new Error(
          data.message ||
            `Failed to ${isEditing ? "update" : "create"} donation`
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert(
        error.message || `Failed to ${isEditing ? "update" : "submit"} donation`
      );
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = isEditing
        ? "Update Donation"
        : "Create Donation";
      if (isEditing) {
        isEditing = false;
        currentDonationId = null;
        clearForm();
      }
    }
  });

  // Edit button handling
  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const donationId = button.getAttribute("data-id");
      const row = button.closest("tr");
      const status = row.querySelector(".status").textContent;

      if (status !== "Pending") {
        alert("Can only edit pending donations.");
        return;
      }

      // Pre-fill form with donation data from data attributes
      document.getElementById("foodType").value =
        row.getAttribute("data-food-type");
      document.getElementById("quantity").value =
        row.getAttribute("data-quantity");
      document.getElementById("unit").value = row.getAttribute("data-unit");
      document.getElementById("expiryDate").value = row
        .getAttribute("data-expiry-date")
        .replace(" ", "T");
      document.getElementById("pickupTime").value =
        row.getAttribute("data-pickup-time");
      document.getElementById("location").value =
        row.getAttribute("data-location");
      document.getElementById("phone").value = row.getAttribute("data-phone");
      document.getElementById("instructions").value =
        row.getAttribute("data-instructions") || "";

      submitButton.textContent = "Update Donation";
      isEditing = true;
      currentDonationId = donationId;
    });
  });

  // Cancel button handling
  cancelButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const donationId = button.getAttribute("data-id");
      const row = button.closest("tr");
      const status = row.querySelector(".status").textContent;

      if (status !== "Pending") {
        alert("Can only cancel pending donations.");
        return;
      }

      if (!confirm("Are you sure you want to cancel this donation?")) return;

      try {
        const response = await fetch(
          `/Restaurant/donation/${donationId}/cancel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": document.querySelector('meta[name="csrf-token"]')
                .content,
            },
            body: JSON.stringify({}),
          }
        );

        const data = await response.json();

        if (response.ok && data.status === "success") {
          row.querySelector(".status").textContent = "Cancelled";
          row.querySelector(".status").className = "status cancelled";
          button.disabled = true;
          button.textContent = "Cancelled";
          alert("Donation cancelled successfully!");
        } else {
          throw new Error(data.message || "Failed to cancel donation");
        }
      } catch (error) {
        console.error("Error:", error);
        alert(error.message || "Failed to cancel donation");
      }
    });
  });
});

function clearForm() {
  document.getElementById("donationForm").reset();
  document.getElementById("location").value = "";
  const geocoderInput = document.querySelector(
    ".mapboxgl-ctrl-geocoder--input"
  );
  if (geocoderInput) {
    geocoderInput.value = "";
  }
}

// Get the button element
const scrollToTopButton = document.querySelector('.scroll-to-top-button');

// Show/hide button based on scroll position
window.addEventListener('scroll', () => {
  if (window.scrollY > 100) { // Show button after scrolling 100px
    scrollToTopButton.style.display = 'flex';
  } else {
    scrollToTopButton.style.display = 'none';
  }
});

// Smooth scroll to top when button is clicked
scrollToTopButton.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});