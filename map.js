function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: { lat: 25.0330, lng: 121.5654 },
  });

  const routeCoordinates = [
    { lat: 25.0330, lng: 121.5654 }, // 台北101
    { lat: 25.0375, lng: 121.5637 },
    { lat: 25.0418, lng: 121.5505 } // 市政府站
  ];

  const crowdLevels = [1, 4]; // 模擬每段的人潮擁擠度（0-5）

  function getColor(level) {
    if (level <= 1) return "#00C853"; // 綠色
    if (level <= 3) return "#FFD600"; // 黃色
    return "#D50000"; // 紅色
  }

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const segment = new google.maps.Polyline({
      path: [routeCoordinates[i], routeCoordinates[i + 1]],
      geodesic: true,
      strokeColor: getColor(crowdLevels[i]),
      strokeOpacity: 1.0,
      strokeWeight: 6,
    });
    segment.setMap(map);
  }

  new google.maps.Marker({
    position: routeCoordinates[0],
    map,
    label: "起",
  });

  new google.maps.Marker({
    position: routeCoordinates[routeCoordinates.length - 1],
    map,
    label: "終",
  });

  document.getElementById("info").innerText = "顏色標示：綠（人少）→ 黃（中等）→ 紅（擁擠）";
}

window.onload = initMap;