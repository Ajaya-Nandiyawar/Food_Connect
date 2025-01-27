// Sample location data - replaced with two types of data (green and red)
const locations = [
  {
    position: { lat: 18.5912, lng: 73.89 },
    title: "Hadapsar Food Pickup",
    description: "Vegetable Curry and Rice",
    quantity: "18 containers",
    type: "red",
  },
  {
    position: { lat: 18.501, lng: 73.8835 },
    title: "Kalyani Nagar Food Pickup",
    description: "Chapati, Rice, and Vegetables",
    quantity: "20 containers",
    type: "green",
  },
  {
    position: { lat: 18.5761, lng: 73.7982 },
    title: "Pimpri Food Pickup",
    description: "Rice, Dal, and Pickles",
    quantity: "10 containers",
    type: "green",
  },
  {
    position: { lat: 18.468, lng: 73.8832 },
    title: "Aundh Food Pickup",
    description: "Vegetable Pulao and Raita",
    quantity: "14 containers",
    type: "red",
  },
  {
    position: { lat: 18.5705, lng: 73.7987 },
    title: "Bavdhan Food Pickup",
    description: "Packed Snacks and Juice",
    quantity: "12 containers",
    type: "green",
  },
  {
    position: { lat: 18.5207, lng: 73.8572 },
    title: "FC Road Food Pickup",
    description: "Sandwiches and Water Bottles",
    quantity: "9 containers",
    type: "red",
  },
  {
    position: { lat: 18.5231, lng: 73.8625 },
    title: "JM Road Food Pickup",
    description: "Chapati, Rice, and Vegetable Curry",
    quantity: "15 containers",
    type: "green",
  },
  {
    position: { lat: 18.5424, lng: 73.8728 },
    title: "Koregaon Park Food Pickup",
    description: "Biriyani and Salad",
    quantity: "16 containers",
    type: "red",
  },
  {
    position: { lat: 18.5958, lng: 73.8873 },
    title: "Magarpatta Food Pickup",
    description: "Pasta and Garlic Bread",
    quantity: "11 containers",
    type: "green",
  },
  {
    position: { lat: 18.4629, lng: 73.8524 },
    title: "Viman Nagar Food Pickup",
    description: "Dosa, Sambhar, and Coconut Chutney",
    quantity: "13 containers",
    type: "red",
  },
  {
    position: { lat: 18.5532, lng: 73.8967 },
    title: "Pune Camp Food Pickup",
    description: "Cooked Meals - Rice and Dal",
    quantity: "17 containers",
    type: "green",
  },
  {
    position: { lat: 18.456, lng: 73.8082 },
    title: "Narhe Food Pickup",
    description: "Chapati, Sabzi, and Rice",
    quantity: "10 containers",
    type: "green",
  },
  {
    position: { lat: 18.5345, lng: 73.8809 },
    title: "Shivaji Nagar Food Pickup",
    description: "Vegetable Pulao and Raita",
    quantity: "22 containers",
    type: "red",
  },
  {
    position: { lat: 18.576, lng: 73.8483 },
    title: "Hadapsar Food Pickup",
    description: "Rice, Sabzi, and Buttermilk",
    quantity: "19 containers",
    type: "green",
  },
  {
    position: { lat: 18.5366, lng: 73.8474 },
    title: "Kothrud Food Pickup",
    description: "Cooked Meals - Biryani and Aloo Gobi",
    quantity: "14 containers",
    type: "red",
  },
  {
    position: { lat: 18.5557, lng: 73.8191 },
    title: "Wakad Food Pickup",
    description: "Rice, Dal, and Papad",
    quantity: "13 containers",
    type: "green",
  },
  {
    position: { lat: 18.4923, lng: 73.9127 },
    title: "Kharadi Food Pickup",
    description: "Chole Bhature and Raita",
    quantity: "8 containers",
    type: "red",
  },
  {
    position: { lat: 18.4572, lng: 73.8189 },
    title: "Dapodi Food Pickup",
    description: "Pasta, Salad, and Ice Cream",
    quantity: "11 containers",
    type: "green",
  },
  {
    position: { lat: 18.5308, lng: 73.808 },
    title: "Kothrud Food Pickup",
    description: "Veg Sandwiches and Fruit Juices",
    quantity: "17 containers",
    type: "red",
  },
];
function initMap() {
  // Create map centered on the first location
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: locations[6].position,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  });

  // Create info window for displaying location details
  const infoWindow = new google.maps.InfoWindow();

  // Create markers for each location
  locations.forEach((location) => {
    // Determine marker color based on location type (green or red)
    let markerColor;
    if (location.type === "red") markerColor = "#FF0000"; // Red marker
    else if (location.type === "green") markerColor = "#00FF00"; // Green marker

    // Create marker with custom dot style
    const marker = new google.maps.Marker({
      position: location.position,
      map: map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: markerColor,
        fillOpacity: 0.7,
        strokeWeight: 1,
        strokeColor: "#FFFFFF",
      },
    });

    // Create info window content
    const content = `
    <div class="marker-info">
        <h3>${location.title}</h3>
        <p>${location.description}</p>
        <p><strong>Quantity:</strong> ${location.quantity}</p>
        <p><strong>Location:</strong> <a href="https://www.google.com/maps?q=${location.position.lat},${location.position.lng}" target="_blank">View Location</a></p>
    </div>
`;

    // Add click event listener to marker
    marker.addListener("click", () => {
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
    });
  });
}
