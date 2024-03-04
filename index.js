let map;
const DEGREES_TO_RADIANS = Math.PI / 180;
const CIRCLE_SPEED = (Math.random() * (300 - 110) + 110) / 3.6;

// map init
async function initMap() {
  const position = { lat: 58.7434101, lng: 25.287841 };
  const { Map, Circle, InfoWindow } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
    zoom: 10,
    center: position,
    mapId: "terrain",
  });

  const circleRadius = new Circle ({
    strokeColor: "#3366ff",
    strokeWeight: 2,
    fillColor: "transparent",
    center: position,
    radius: Math.round(Math.random() * (30000 - 10000) + 10000),
  });

  animateCircle(circleRadius, InfoWindow);
}

// Object - Circle

let positionHistory = [];

function getCirclePoints(center, radius, numberOfPoints) {
  const METERS_PER_DEGREE = 111300;
  let points = [];

  const cosLat = Math.cos(center.lat * DEGREES_TO_RADIANS);

  for (let i = 0; i < numberOfPoints; i++) {
    const angle = (i * 360 / numberOfPoints) * DEGREES_TO_RADIANS;
    const pointLat = center.lat + (radius / METERS_PER_DEGREE) * Math.sin(angle);
    const pointLng = center.lng + (radius / METERS_PER_DEGREE) * Math.cos(angle) / cosLat;
    points.push({ lat: pointLat, lng: pointLng });
  }

  return points;
}

function animateCircle(circleRadius, InfoWindow) {
  
  const center = circleRadius.getCenter().toJSON();
  const radius = circleRadius.getRadius();
  const circumference = 2 * Math.PI * radius;

  let i = 0;
  const points = getCirclePoints(center, radius, 360);

  let movingCircle = new google.maps.Circle({
      strokeColor: "transparent",
      fillColor: "#FF0000",
      fillOpacity: 1,
      map: map,
      center: points[i],
      radius: 500,
  });

  function moveCircle() {
    const pointsToMove = CIRCLE_SPEED / (circumference / points.length);

    i += pointsToMove;
    
    // Check if the circle object has arrived
    if (i >= points.length) {
        movingCircle.setMap(null);
        clearTimeout(timeout);
        return;
    }

    movingCircle.setCenter(points[Math.floor(i)]);

    positionHistory.push({ position: movingCircle.getCenter().toJSON(), timestamp: Date.now() });
    positionHistory = positionHistory.filter(p => p.timestamp > (Date.now() - 60000));

    let timeout = setTimeout(moveCircle, 1000);
  }

  moveCircle();

  movingCircle.addListener("click", () => {
    const currentPosition = movingCircle.getCenter();
    const timeInSeconds = circumference / CIRCLE_SPEED;
    const timeInMinutes = timeInSeconds / 60;

    const infoWindowContent = `
        <div>
            <p>Speed: ${Math.round(CIRCLE_SPEED * 3.6)} km/h</p>
            <p>Latitude: ${currentPosition.lat().toFixed(6)}</p>
            <p>Longitude: ${currentPosition.lng().toFixed(6)}</p>
            <p>Arrival in: ${Math.round(timeInMinutes)} minutes</p>
        </div>
    `;

    const tailPath = new google.maps.Polyline({
      path: positionHistory.map(p => new google.maps.LatLng(p.position.lat, p.position.lng)),
      geodesic: true,
      strokeColor: "#e0770d",
      strokeOpacity: 1,
      strokeWeight: 2,
      icons: [{
          icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: "#e0770d",
              fillColor: "#e0770d",
              fillOpacity: 1,
          },
          offset: "100%",
          repeat: "20px"
      }]
  });

    circleRadius.setMap(map);
    tailPath.setMap(map);

    const infoWindow = new InfoWindow({
        content: infoWindowContent,
        position: currentPosition
    });

    google.maps.event.addListener(infoWindow, "closeclick", () => {
      circleRadius.setMap(null);
      tailPath.setMap(null);
    });

    infoWindow.open(map);
});
}