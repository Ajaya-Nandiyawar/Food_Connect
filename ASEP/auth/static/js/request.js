// Form handling
document.getElementById("donationForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = {
    date: document.getElementById("pickupDate").value,
    time: document.getElementById("pickupTime").value,
    // Add other form fields here
  };
  console.log("Form submitted:", formData);
});

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("pickupDate").min = today;
});

const mapboxAccessToken =
  "pk.eyJ1IjoidGhlLWRlc3Ryb3llciIsImEiOiJjbTdkbWd1ZjIwMDJ3MmpxdXp3dWNpb3VlIn0.GtirZBfgEJOCgwsM9ZB0Zg";
const locationInput = document.getElementById("locationInput");
const suggestionsList = document.getElementById("suggestions");

async function fetchLocationSuggestions(query) {
  if (query.length < 3) {
    suggestionsList.innerHTML = ""; // Clear suggestions if query is too short
    return;
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxAccessToken}&autocomplete=true&limit=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    suggestionsList.innerHTML = ""; // Clear previous results

    data.features.forEach((place) => {
      const li = document.createElement("li");
      li.textContent = place.place_name;
      li.addEventListener("click", () => {
        locationInput.value = place.place_name;
        suggestionsList.innerHTML = ""; // Hide suggestions after selection
      });
      suggestionsList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
  }
}

locationInput.addEventListener("input", () => {
  fetchLocationSuggestions(locationInput.value);
});

document.addEventListener("click", (event) => {
  if (
    !locationInput.contains(event.target) &&
    !suggestionsList.contains(event.target)
  ) {
    suggestionsList.innerHTML = ""; // Close suggestions when clicking outside
  }
});
