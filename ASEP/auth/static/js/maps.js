mapboxgl.accessToken =
  "pk.eyJ1IjoidGhlLWRlc3Ryb3llciIsImEiOiJjbTdkbWd1ZjIwMDJ3MmpxdXp3dWNpb3VlIn0.GtirZBfgEJOCgwsM9ZB0Zg";

// Initialize Map globally
window.map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [73.8572, 18.5207], // Pune center
  zoom: 11,
});

window.markers = []; // Global markers array

// Fetch NGO Requests from Backend
function fetchNGORequests() {
  fetch("/ngo/request")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text(); // Expect HTML from GET request, parse accordingly
    })
    .then((html) => {
      // Since /ngo/request GET returns HTML, we can't parse it as JSON directly.
      // Instead, we'll rely on the backend to provide data via POST response.
      console.log(
        "Fetched NGO Requests HTML - use POST for real-time updates."
      );
    })
    .catch((error) => console.error("Error fetching NGO requests:", error));
}

// Function to Add a Green Marker for NGO Requests (already defined in request.html)
function addNGOMarker(lat, lng, title) {
  const el = document.createElement("div");
  el.className = "marker-delivery"; // Green marker styling

  const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
    <h3>${title}</h3>
    <p><strong>Type:</strong> Food Delivery Point</p>
  `);

  const marker = new mapboxgl.Marker(el)
    .setLngLat([lng, lat])
    .setPopup(popup)
    .addTo(map);

  markers.push(marker);
}

// Clear all markers before adding new ones
function clearMarkers() {
  markers.forEach((marker) => marker.remove());
  markers = [];
}

// Load NGO Requests on Map Load
map.on("load", () => {
  fetchNGORequests(); // This won't add markers since GET returns HTML
  map.addControl(new mapboxgl.NavigationControl());
});

// Load Data on Page Load
document.addEventListener("DOMContentLoaded", fetchNGORequests);
