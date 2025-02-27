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

  // Form submission
  document
    .getElementById("donationForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = {
        food_type: document.getElementById("foodType").value,
        quantity: document.getElementById("quantity").value,
        unit: document.getElementById("unit").value,
        expiry_date: document.getElementById("expiryDate").value,
        pickup_time: document.getElementById("pickupTime").value,
        special_instructions: document.getElementById("instructions").value,
        location: document.getElementById("location").value,
        phone: document.getElementById("phone").value,
      };

      fetch("http://127.0.0.1:5000/Restaurant/donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": document.querySelector('meta[name="csrf-token"]')
            .content,
        },
        body: JSON.stringify(formData),
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          alert(data.message);
          if (data.status === "success") window.location.reload();
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Failed to submit donation. Check console for details.");
        });
    });
});

function clearForm() {
  document.getElementById("donationForm").reset();
  document.getElementById("location").value = "";
  document.querySelector(".mapboxgl-ctrl-geocoder--input").value = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const donationForm = document.getElementById("donationForm");

  donationForm.addEventListener("submit", function (event) {
    event.preventDefault();

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

    fetch("/Restaurant/donation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": document.querySelector('meta[name="csrf-token"]')
          .content,
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        if (data.status === "success") {
          alert(data.message);
          window.location.reload(); // Refresh to show the new donation
        } else {
          alert("Error: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to create donation");
      });
  });
});

function clearForm() {
  document.getElementById("donationForm").reset();
}
