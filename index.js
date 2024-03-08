let map;
let square, squareTail, circlePath, circleTail, triangle, trianglePath;
let infoWindow = document.getElementById("InfoWindow");

// Speed constants
const SQUARE_SPEED = (Math.random() * (80 - 50) + 50) / 3.6;
const CIRCLE_SPEED = (Math.random() * (300 - 110) + 110) / 3.6;
const TRIANGLE_SPEED = (Math.random() * (2200 - 1700) + 1700) / 3.6;

const RADIANS = Math.PI / 180;
const RADIUS = 1000;
const INTERVAL = 1000;

// Position history
let squarePosHistory = [];
let circlePosHistory = [];
let trianglePosHistory = [];

let triangleCoords;
let destination = getRandomLocation();

// Map init
async function initMap() {
  const position = { lat: 58.7434101, lng: 25.287841 };
  const { Map, Circle } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
    zoom: 9,
    center: position,
    mapId: "terrain",
  });
  
  circlePath = new Circle ({
    strokeColor: "#3366ff",
    strokeWeight: 2,
    fillColor: "transparent",
    center: position,
    radius: Math.round(Math.random() * (30000 - 10000) + 10000),
  });

  animateSquare(position);
  animateCircle(circlePath);
  moveTriangleToDestination(position, destination);
}

// Object - Square

function calculateSquareBounds(center, sideLength) {
  const latChange = (sideLength / 2) / 111320;
  const lngChange = (sideLength / 2) / (111320 * Math.cos(center.lat * RADIANS));

  return {
      north: center.lat + latChange,
      south: center.lat - latChange,
      east: center.lng + lngChange,
      west: center.lng - lngChange,
  };
}

function animateSquare(position) {
  squareTail = new google.maps.Polyline({
    path: squarePosHistory.map(p => ({ lat: p.lat, lng: p.lng })),
    geodesic: true,
    strokeColor: "#e0770d",
    strokeOpacity: 1,
    strokeWeight: 2,
    zIndex: 3,
    icons: [{
        icon: {
            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
            scale: 3,
            strokeColor: "#e0770d",
            fillColor: "#e0770d",
            fillOpacity: 1,
        },
        offset: "100%",
        repeat: "20px"
    }]
  });
  function moveSquare() {
    const latChange = 0;
    const lngChange = SQUARE_SPEED / (111320 * Math.cos(position.lat * RADIANS));

    position = {
      lat: position.lat + latChange,
      lng: position.lng + lngChange,
    };

    const timestamp = Date.now();
    squarePosHistory.push({ lat: position.lat, lng: position.lng, timestamp: timestamp });
    const minute = timestamp - 60000;
    while (squarePosHistory.length > 0 && squarePosHistory[0].timestamp < minute) {
      squarePosHistory.shift();
    }

    squareTail.setPath(squarePosHistory.map(p => ({ lat: p.lat, lng: p.lng })));

    const bounds = calculateSquareBounds(position, RADIUS);
    if (square) {
      // If the rectangle already exists, update its bounds
      square.setBounds(bounds);
    } else {
      // Create a new rectangle
      square = new google.maps.Rectangle({
        strokeColor: "#FF0000",
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 1,
        map: map,
        bounds: bounds,
        zIndex: 5
      });
    }
    setTimeout(moveSquare, INTERVAL);
  };

  moveSquare();

  square.addListener("click", () => {
    let name = "Object: Square";
    let speed = Math.round(SQUARE_SPEED * 3.6);
    let pos = {lat: position.lat.toFixed(6), lng: position.lng.toFixed(6)};
    let time = "N/A";

    squareTail.setMap(map);

    map.panTo(new google.maps.LatLng(position.lat, position.lng));
    updateInfoWindow(name, speed, pos, time);
  });
}

// Object - Circle

function getCirclePoints(center, radius, numberOfPoints) {
  const METERS_PER_DEGREE = 111300;
  let points = [];

  const cosLat = Math.cos(center.lat * RADIANS);

  for (let i = 0; i < numberOfPoints; i++) {
    const angle = (i * 360 / numberOfPoints) * RADIANS;
    const pointLat = center.lat + (radius / METERS_PER_DEGREE) * Math.sin(angle);
    const pointLng = center.lng + (radius / METERS_PER_DEGREE) * Math.cos(angle) / cosLat;
    points.push({ lat: pointLat, lng: pointLng });
  }

  return points;
}

function animateCircle(circlePath) {
  const center = circlePath.getCenter().toJSON();
  const radius = circlePath.getRadius();
  const circumference = 2 * Math.PI * radius;
  const totalDurationSeconds = circumference / CIRCLE_SPEED;
  const points = getCirclePoints(center, radius, 360);
  
  let movingCircle = new google.maps.Circle({
    strokeColor: "transparent",
    fillColor: "#FF0000",
    fillOpacity: 1,
    map: map,
    center: points[0],
    radius: RADIUS,
    zIndex: 5
  });

  circleTail = new google.maps.Polyline({
    geodesic: true,
    strokeColor: "#e0770d",
    strokeOpacity: 1,
    strokeWeight: 2,
    zIndex: 3,
    icons: [{
      icon: {
        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
        scale: 3,
        strokeColor: "#e0770d",
        fillColor: "#e0770d",
        fillOpacity: 1,
      },
      offset: "100%",
      repeat: "20px"
    }]
  });

  let i = 0;
  let startTime = performance.now();
  let elapsedTime = 0;

  function moveCircle(timestamp) {
    const elapsedTime = (timestamp - startTime) / 1000;

    if (elapsedTime < totalDurationSeconds) {
      i = Math.floor((elapsedTime / totalDurationSeconds) * points.length) % points.length;
      if (points[i]) {
        movingCircle.setCenter(new google.maps.LatLng(points[i].lat, points[i].lng));
        circlePosHistory.push({ position: points[i], timestamp: Date.now() });

        const minute = Date.now() - 60000;
        circlePosHistory = circlePosHistory.filter(p => p.timestamp > minute);
        let tailPoints = circlePosHistory.map(p => new google.maps.LatLng(p.position.lat, p.position.lng)).filter(p => p !== null);

        circleTail.setPath(tailPoints);
        requestAnimationFrame(moveCircle);
      }
    } else {
      movingCircle.setMap(null);
      circleTail.setMap(null);
      circlePath.setMap(null);
    }
  }

  requestAnimationFrame(moveCircle);

  movingCircle.addListener("click", () => {
    const position = movingCircle.getCenter();
    let name = "Object: Circle";
    let speed = Math.round(CIRCLE_SPEED * 3.6);
    let pos = {lat: position.lat().toFixed(6), lng: position.lng().toFixed(6)};
    let time = Math.round(((circumference - (elapsedTime * CIRCLE_SPEED)) / CIRCLE_SPEED) /60);

    circleTail.setMap(map);
    circlePath.setMap(map);

    map.panTo(new google.maps.LatLng(position.lat(), position.lng()));
    updateInfoWindow(name, speed, pos, time);
  });
}

// Object - Triangle

function calculatePoint(start, distance, bearing) {
  const R = 6371e3;
  const bearingRad = bearing * Math.PI / 180;
  const φ1 = start.lat * Math.PI / 180;
  const λ1 = start.lng * Math.PI / 180;
  const δ = distance / R;

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(bearingRad));
  const λ2 = λ1 + Math.atan2(Math.sin(bearingRad) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

  return { lat: φ2 * 180 / Math.PI, lng: λ2 * 180 / Math.PI };
}

function calculateDistance(start, end) {
  const R = 6371e3;
  const φ1 = start.lat * RADIANS;
  const φ2 = end.lat * RADIANS;
  const Δφ = (end.lat - start.lat) * RADIANS;
  const Δλ = (end.lng - start.lng) * RADIANS;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getTriangleCoords(position, radius) {
  return [90, 210, 330].map(angle => calculatePoint(position, radius, angle)).concat([calculatePoint(position, radius, 90)]);
}

function moveTriangleToDestination(start, destination) {
  let currentPosition = start;
  const triangleCoords = getTriangleCoords(start, RADIUS);

  triangle = new google.maps.Polygon({
    paths: triangleCoords,
    strokeColor: '#FF0000',
    strokeOpacity: 1,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 1,
    map: map,
  });

  trianglePath = new google.maps.Polyline({
    path: [currentPosition, destination],
    geodesic: true,
    strokeColor: "#0000FF",
    strokeOpacity: 0.5,
    strokeWeight: 2,
  });
  
  let startTime = performance.now();
  const totalDistance = calculateDistance(start, destination);
  const totalTimeSeconds = totalDistance / TRIANGLE_SPEED;
  
  function animateTriangle(timestamp) {
    elapsedTimeSeconds = (timestamp - startTime) / 1000;
    if (elapsedTimeSeconds >= totalTimeSeconds) {
      triangle.setMap(null);
      return;
    }
    const fraction = elapsedTimeSeconds / totalTimeSeconds;
    const lat = start.lat + (destination.lat - start.lat) * fraction;
    const lng = start.lng + (destination.lng - start.lng) * fraction;
    currentPosition = {lat: lat, lng: lng};

    const newCoords = getTriangleCoords(currentPosition, RADIUS);
    triangle.setPaths(newCoords);

    requestAnimationFrame(animateTriangle);
  }

  requestAnimationFrame(animateTriangle);

  triangle.addListener('click', () => {
    let name = "Object: Triangle";
    let speed = Math.round(TRIANGLE_SPEED * 3.6);
    let pos = {lat: currentPosition.lat.toFixed(6), lng: currentPosition.lng.toFixed(6)};
    let time = Math.round(Math.round((3600 - elapsedTimeSeconds) / 60));

    trianglePath.setMap(map);

    map.panTo(new google.maps.LatLng(currentPosition.lat, currentPosition.lng));
    updateInfoWindow(name, speed, pos, time);
  });
}

// Random location on Earth
function getRandomLocation() {
  const latitude = Math.random() * 180 - 90;
  const longitude = Math.random() * 360 - 180;
  return { lat: latitude, lng: longitude };
}

// Update popup content
function updateInfoWindow(name,speed, pos, time) {
  let infoWindowContent = `
    <div class="container">
      <div class="head">Speed</div>
        <div class="body">${speed} km/h</div>
      <div class="head">Position</div>
        <div class="body">${pos.lat}, ${pos.lng}</div>
      <div class="head">Expiry</div>
        <div class="body">${time} minutes</div>
    </div>
  `;
  document.getElementById("infoContent").innerHTML = infoWindowContent;
  document.getElementById("Object").innerHTML = name;
  document.getElementById("InfoWindow").style.display = "grid";
}

function closeInfoWindow() {
  squareTail.setMap(null);
  circleTail.setMap(null);
  circlePath.setMap(null);
  trianglePath.setMap(null);
  infoWindow.style.display = "none";
}