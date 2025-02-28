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

  // Form submission handling with prevention of multiple submissions
  const donationForm = document.getElementById("donationForm");
  let isSubmitting = false;

  donationForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) return;
    isSubmitting = true;

    // Get submit button and show loading state
    const submitButton = document.querySelector(".Create_Donation");
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

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
      const response = await fetch("/Restaurant/donation", {
        method: "POST",
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
        window.location.reload();
      } else {
        throw new Error(data.message || "Failed to create donation");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Failed to submit donation");
    } finally {
      // Reset submission state and button
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = "Create Donation";
    }
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