var map = L.map('map').setView([58.6682798, 25.160383], 7);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

  var circle = L.circle([59.4326137, 24.7493339], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 1000
}).addTo(map);

// Center of the circle and radius
var center = [58.6682798, 25.160383];
var radius = 10000; // in meters, can be between 10000 and 30000
var constantSpeed = Math.round(Math.random() * (300 - 110) + 110);

circle.bindPopup(`Speed: ${constantSpeed} km/h`);

// Function to update the marker's position
function updateMarkerPosition(angle) {
    var angleRad = angle * (Math.PI / 180);
    var newLat = center[0] + (radius / 1000 / 111.32) * Math.cos(angleRad);
    var newLng = center[1] + (radius / 1000 / 111.32) * Math.sin(angleRad) / Math.cos(center[0] * Math.PI / 180);
    circle.setLatLng([newLat, newLng]);
     // Update popup content with the new position
    circle.getPopup().setContent('Latitude: ' + newLat.toFixed(5) + ', Longitude: ' + newLng.toFixed(5));
}

// Calculate distance per interval based on speed
function calculateDistancePerInterval(speedKmH) {
    var speedKmS = speedKmH / 3600; // Convert speed to km/s
    return speedKmS * (updateInterval / 1000); // Distance per interval in km
}

var angle = 0;
var updateInterval = 100; // Update every 100 ms

var intervalId = setInterval(function() {
    var distancePerInterval = calculateDistancePerInterval(constantSpeed); // Use constant speed
    var circumference = 2 * Math.PI * (radius / 1000); // Circumference of the circle in km
    var angleIncrement = (distancePerInterval / circumference) * 360; // Convert distance to angle

    angle += angleIncrement;
    if(angle >= 360) {
        circle.remove(); // Remove the marker from the map
        clearInterval(intervalId); // Stop the interval
    } else {
        updateMarkerPosition(angle);
    }
}, updateInterval);