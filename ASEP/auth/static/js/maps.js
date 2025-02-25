mapboxgl.accessToken = "pk.eyJ1IjoidGhlLWRlc3Ryb3llciIsImEiOiJjbTdkbWd1ZjIwMDJ3MmpxdXp3dWNpb3VlIn0.GtirZBfgEJOCgwsM9ZB0Zg";

// Initialize map
const map = new mapboxgl.Map({
    container: "map",
    style: 'mapbox://styles/mapbox/streets-v11', // Added missing style property
    center: [73.8572, 18.5207], // Pune center
    zoom: 11,
});

// Location data
let locations = JSON.parse(localStorage.getItem('foodLocations')) || [
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
    position: { lat: 4629, lng: 73.8524 },
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

let markers = []; // Array to store marker references

function addMarkers(locations) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    locations.forEach(location => {
        const el = document.createElement('div');
        el.className = location.type === 'red' ? 'marker-pickup' : 'marker-delivery';

        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                <h3>${location.title}</h3>
                <p><strong>Food Item:</strong> ${location.foodItem || location.description}</p>
                <p><strong>Quantity:</strong> ${location.quantity}</p>
                ${location.contact ? `<p><strong>Contact:</strong> <a href="tel:${location.contact}">${location.contact}</a></p>` : ''}
                <p><strong>Type:</strong> ${location.type === 'red' ? 'Pickup Point' : 'Delivery Point'}</p>
            `);

        // Create and store marker reference
        const marker = new mapboxgl.Marker(el)
            .setLngLat([location.position.lng, location.position.lat])
            .setPopup(popup)
            .addTo(map);

        // Store marker type for filtering
        marker.type = location.type;
        markers.push(marker);
    });

    updateActivePoints();
}

function updateActivePoints() {
    const activePointsElement = document.getElementById('activePoints');
    if (activePointsElement) {
        const visibleMarkers = markers.filter(marker => 
            !marker.getElement().style.display || 
            marker.getElement().style.display !== 'none'
        );
        activePointsElement.textContent = visibleMarkers.length;
    }
}

function filterMarkers(type, show) {
    markers.forEach(marker => {
        if (marker.type === type) {
            marker.getElement().style.display = show ? 'block' : 'none';
        }
    });
    updateActivePoints();
}

// Wait for map to load before adding markers and controls
map.on('load', () => {
    // Add markers
    addMarkers(locations);

    // Add navigation control to the map
    map.addControl(new mapboxgl.NavigationControl());

    // Add geocoder for searching places
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: 'Search for a location', // Added placeholder text
        countries: 'IN', // Limit search to India
        bbox: [73.7, 18.4, 74.0, 18.7] // Limit search to Pune region
    });

    map.addControl(geocoder, "top-left");

    // Handle geocoder result
    geocoder.on("result", (e) => {
        const { result } = e;
        const { center } = result;

        // Add a custom marker for the searched place
        const marker = new mapboxgl.Marker()
            .setLngLat(center)
            .setPopup(
                new mapboxgl.Popup().setHTML(
                    `<div class="marker-info"><h3>${result.place_name}</h3></div>`
                )
            )
            .addTo(map);

        // Fly to the searched location
        map.flyTo({ center, zoom: 14 });
    });
});

// Function to populate the dropdown lists
function populateDropdowns(locations) {
    const startPointSelect = document.getElementById('startPoint');
    const endPointSelect = document.getElementById('endPoint');
    
    if (!startPointSelect || !endPointSelect) {
        console.warn('Dropdown elements not found in the DOM');
        return;
    }
    
    // Clear existing options
    startPointSelect.innerHTML = '<option value="">Select starting point</option>';
    endPointSelect.innerHTML = '<option value="">Select destination</option>';
    
    // Add locations to both dropdowns
    locations.forEach(location => {
        const startOption = document.createElement('option');
        const endOption = document.createElement('option');
        
        const coordinates = {
            lng: location.position.lng,
            lat: location.position.lat
        };
        
        startOption.value = JSON.stringify(coordinates);
        startOption.textContent = location.title;
        
        endOption.value = JSON.stringify(coordinates);
        endOption.textContent = location.title;
        
        startPointSelect.appendChild(startOption.cloneNode(true));
        endPointSelect.appendChild(endOption);
    });
}

// Initialize dropdowns when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    populateDropdowns(locations);
});

let currentRoute = null;
let directionsControl = null;

function calculateRoute() {
    const startPoint = JSON.parse(document.getElementById('startPoint').value);
    const endPoint = JSON.parse(document.getElementById('endPoint').value);

    if (!startPoint || !endPoint) {
        alert('Please select both start and end points');
        return;
    }

    // Remove existing route if any
    if (currentRoute) {
        currentRoute.remove();
    }

    // Remove existing directions control
    if (directionsControl) {
        map.removeControl(directionsControl);
    }

    // Add directions control
    directionsControl = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving',
        alternatives: true,
        geometries: 'geojson'
    });

    map.addControl(directionsControl, 'top-right');

    // Set origin and destination
    directionsControl.setOrigin([startPoint.lng, startPoint.lat]);
    directionsControl.setDestination([endPoint.lng, endPoint.lat]);

    // Update route info when route is calculated
    directionsControl.on('route', (e) => {
        const route = e.route[0];
        document.getElementById('routeDistance').textContent = 
            `${(route.distance / 1000).toFixed(2)} km`;
        document.getElementById('routeDuration').textContent = 
            `${Math.round(route.duration / 60)} mins`;
    });
}

// Replace the existing optimizeRoute function with this updated version
function optimizeRoute() {
    const startPoint = JSON.parse(document.getElementById('startPoint').value);
    if (!startPoint) {
        alert('Please select a starting point');
        return;
    }

    try {
        // Remove existing route if any
        if (currentRoute) {
            currentRoute.remove();
        }

        // Get all delivery points (green markers)
        const deliveryPoints = locations.filter(loc => loc.type === 'green');
        
        if (deliveryPoints.length === 0) {
            alert('No delivery points found to optimize');
            return;
        }

        // Convert points to turf features
        const points = deliveryPoints.map(point => ({
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: [point.position.lng, point.position.lat]
            }
        }));

        // Create a feature collection
        const collection = turf.featureCollection(points);

        // Starting point
        const origin = turf.point([startPoint.lng, startPoint.lat]);

        // Calculate optimized route
        let optimizedRoute = [origin];
        let remaining = [...points];

        while (remaining.length > 0) {
            const currentPoint = optimizedRoute[optimizedRoute.length - 1];
            const nearest = turf.nearest(currentPoint, turf.featureCollection(remaining));
            optimizedRoute.push(nearest);
            remaining = remaining.filter(point => 
                point.geometry.coordinates[0] !== nearest.geometry.coordinates[0] ||
                point.geometry.coordinates[1] !== nearest.geometry.coordinates[1]
            );
        }

        // Extract coordinates for the route
        const routeCoordinates = optimizedRoute.map(point => point.geometry.coordinates);

        // Add the route to the map
        map.addLayer({
            id: 'optimized-route',
            type: 'line',
            source: {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: routeCoordinates
                    }
                }
            },
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#3887be',
                'line-width': 5,
                'line-opacity': 0.75
            }
        });

        // Store current route for later removal
        currentRoute = {
            remove: () => {
                if (map.getLayer('optimized-route')) {
                    map.removeLayer('optimized-route');
                }
                if (map.getSource('optimized-route')) {
                    map.removeSource('optimized-route');
                }
            }
        };

        // Fit map to show the entire route
        const bounds = new mapboxgl.LngLatBounds();
        routeCoordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 50 });

    } catch (error) {
        console.error('Error in route optimization:', error);
        alert('An error occurred while optimizing the route. Please try again.');
    }
}

function clearRoute() {
    if (currentRoute) {
        currentRoute.remove();
    }
    if (directionsControl) {
        map.removeControl(directionsControl);
        directionsControl = null;
    }
    
    document.getElementById('routeDistance').textContent = '-';
    document.getElementById('routeDuration').textContent = '-';
}


// recent enhnacement
// Add these variables to your JavaScript
let newLocation = null;
let isPlacing = false;

// Initialize geocoder for location search
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  placeholder: 'Search address or coordinates',
  bbox: [73.7, 18.4, 74.0, 18.7]
});

// Add geocoder to the form
document.getElementById('locationGeocoder').appendChild(geocoder.onAdd(map));

// Handle geocoder result
geocoder.on('result', (e) => {
  if (isPlacing) {
    newLocation = {
      position: { lat: e.result.center[1], lng: e.result.center[0] },
      title: document.getElementById('locationName').value,
      description: 'Custom food location',
      quantity: '0 containers',
      type: document.getElementById('locationType').value
    };
    updateCoordinateStatus(e.result.center);
  }
});

// Handle map clicks for manual placement
map.on('click', (e) => {
  if (isPlacing) {
    newLocation = {
      position: { lat: e.lngLat.lat, lng: e.lngLat.lng },
      title: document.getElementById('locationName').value,
      description: 'Custom food location',
      quantity: '0 containers',
      type: document.getElementById('locationType').value
    };
    updateCoordinateStatus([e.lngLat.lng, e.lngLat.lat]);
  }
});

function enableLocationPlacement() {
  const name = document.getElementById('locationName').value;
  if (!name) {
    alert('Please enter a location name');
    return;
  }
  isPlacing = true;
  document.getElementById('coordinateStatus').textContent = 
    'Search above or click map to set position';
}

function saveNewLocation() {
    if (!newLocation) {
        alert('Please set location position first');
        return;
    }
    
    // Get additional fields
    newLocation.foodItem = document.getElementById('foodItem').value;
    newLocation.quantity = document.getElementById('quantity').value + ' kg';
    newLocation.contact = document.getElementById('contact').value;

    // Validate contact number
    const phonePattern = /^(\+91|0)?[7-9]\d{9}$/;
    if (!phonePattern.test(newLocation.contact)) {
        alert('Please enter a valid Indian phone number');
        return;
    }

    locations.push(newLocation);
    saveLocationsToStorage(); // Save to localStorage
    addMarkers(locations);
    populateDropdowns(locations);
    
    // Reset form
    document.getElementById('locationName').value = '';
    document.getElementById('foodItem').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('contact').value = '';
    document.getElementById('coordinateStatus').textContent = 
        'Location added successfully!';
    newLocation = null;
    isPlacing = false;
    
    map.flyTo({
        center: [newLocation.position.lng, newLocation.position.lat],
        zoom: 14
    });
}

function updateCoordinateStatus(coords) {
  document.getElementById('coordinateStatus').innerHTML = `
    Position set: <br>
    Latitude: ${coords[1].toFixed(4)}<br>
    Longitude: ${coords[0].toFixed(4)}
  `;
}

function saveLocationsToStorage() {
    localStorage.setItem('foodLocations', JSON.stringify(locations));
}

// Add phone number validation
document.addEventListener('DOMContentLoaded', () => {
    const contactInput = document.getElementById('contact');
    if (contactInput) {
        contactInput.addEventListener('input', function(e) {
            const pattern = /^(\+91|0)?[7-9]\d{9}$/;
            if (!pattern.test(e.target.value)) {
                this.setCustomValidity('Please enter a valid Indian phone number');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // Initialize markers and dropdowns from localStorage
    if (locations.length > 0) {
        addMarkers(locations);
        populateDropdowns(locations);
    }
});

// Add this function after the saveLocationsToStorage function

function exportToCSV() {
    // Define CSV headers
    const headers = [
        'Title',
        'Description',
        'Food Item',
        'Quantity',
        'Contact',
        'Type',
        'Latitude',
        'Longitude'
    ];

    // Convert locations data to CSV format
    const csvData = locations.map(location => [
        location.title,
        location.description,
        location.foodItem || '',
        location.quantity,
        location.contact || '',
        location.type === 'red' ? 'Pickup Point' : 'Delivery Point',
        location.position.lat,
        location.position.lng
    ]);

    // Add headers to the beginning
    csvData.unshift(headers);

    // Convert to CSV string
    const csvString = csvData
        .map(row => row
            .map(cell => `"${cell}"`)
            .join(',')
        )
        .join('\n');

    // Create blob and download link
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'food_locations.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToJSON() {
    try {
        // Convert locations array to JSON string with proper formatting
        const jsonString = JSON.stringify(locations, null, 2);
        
        // Create blob with JSON data
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // Set link attributes
        link.setAttribute('href', url);
        link.setAttribute('download', 'food_locations.json');
        
        // Add link to document, trigger click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting JSON:', error);
        alert('Failed to export JSON file. Please try again.');
    }
}