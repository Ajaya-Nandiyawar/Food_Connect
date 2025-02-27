function messageUs() {
  alert("Message functionality will be implemented here");
}

function scheduleCall() {
  alert("Call scheduling functionality will be implemented here");
}

let originalAboutUsContent = ""; // To store the original content

// Load saved content from localStorage on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedContent = localStorage.getItem("aboutUsContent");
  const content = document.getElementById("aboutUsContent");

  if (savedContent) {
    content.innerText = savedContent; // Load saved content if it exists
  } else {
    originalAboutUsContent = content.innerText; // Set the original content
  }
});

function toggleEditAboutUs() {
  const content = document.getElementById("aboutUsContent");
  const editBtn = document.getElementById("editBtn");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  if (content.isContentEditable) {
    content.contentEditable = "false";
    editBtn.style.display = "block";
    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";
  } else {
    originalAboutUsContent = content.innerText; // Save the original content before editing
    content.contentEditable = "true";
    content.focus();
    editBtn.style.display = "none";
    saveBtn.style.display = "block";
    cancelBtn.style.display = "block";
  }
}

function saveAboutUs() {
  const content = document.getElementById("aboutUsContent");
  const editBtn = document.getElementById("editBtn");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  const updatedContent = content.innerText;

  // Save content to localStorage
  localStorage.setItem("aboutUsContent", updatedContent);

  // Exit edit mode
  content.contentEditable = "false";
  editBtn.style.display = "block";
  saveBtn.style.display = "none";
  cancelBtn.style.display = "none";
}

function cancelEditAboutUs() {
  const content = document.getElementById("aboutUsContent");
  const editBtn = document.getElementById("editBtn");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  // Revert content to the original value and exit edit mode
  content.innerText = originalAboutUsContent;
  content.contentEditable = "false";

  editBtn.style.display = "block";
  saveBtn.style.display = "none";
  cancelBtn.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  const locationSpan = document.getElementById("userLocation");
  const locationLink = document.getElementById("locationLink");
  let watchId;
  let lastApiCall = 0;
  const API_COOLDOWN = 5000; // 5 seconds between API calls

  function updateLocation(position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy);
      const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
      
      // Always update coordinates and map link
      locationLink.href = googleMapsUrl;
      locationLink.style.display = "inline";

      // Check if enough time has passed since last API call
      const now = Date.now();
      if (now - lastApiCall >= API_COOLDOWN) {
          locationSpan.textContent = "Updating address...";
          
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
              .then(response => {
                  if (!response.ok) throw new Error('Network response was not ok');
                  return response.json();
              })
              .then(data => {
                  locationSpan.textContent = `${data.display_name} (Accuracy: ${accuracy}m)`;
                  lastApiCall = now;
              })
              .catch(error => {
                  locationSpan.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)} (Accuracy: ${accuracy}m)`;
              });
      }
  }

  function handleError(error) {
      switch(error.code) {
          case error.PERMISSION_DENIED:
              locationSpan.textContent = "Location access denied. Please enable location services.";
              break;
          case error.POSITION_UNAVAILABLE:
              locationSpan.textContent = "Location information unavailable.";
              break;
          case error.TIMEOUT:
              locationSpan.textContent = "Location request timed out.";
              break;
          default:
              locationSpan.textContent = "An unknown error occurred.";
      }
      locationLink.style.display = "none";
  }

  if (navigator.geolocation) {
      const options = {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
      };

      // Get initial position
      navigator.geolocation.getCurrentPosition(updateLocation, handleError, options);

      // Start watching position
      watchId = navigator.geolocation.watchPosition(updateLocation, handleError, options);

      // Cleanup when page is unloaded
      window.addEventListener('beforeunload', () => {
          if (watchId) navigator.geolocation.clearWatch(watchId);
      });
  } else {
      locationSpan.textContent = "Geolocation is not supported by this browser.";
      locationLink.style.display = "none";
  }
});