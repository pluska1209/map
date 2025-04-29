let map;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: { lat: 25.0330, lng: 121.5654 },
  });
}

async function calculateRoute() {
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!start || !end) {
    alert("請輸入起點和終點");
    return;
  }

  const directionsService = new google.maps.DirectionsService();
  directionsService.route({
    origin: start,
    destination: end,
    travelMode: 'DRIVING',
    provideRouteAlternatives: true
  }, async (response, status) => {
    if (status === 'OK') {
      const routes = response.routes;
      const path = routes[0].overview_path;

      const crowdLevels = await estimateCrowdLevels();

      map.setCenter(path[0]);

      for (let i = 0; i < path.length - 1; i++) {
        const segment = new google.maps.Polyline({
          path: [path[i], path[i + 1]],
          geodesic: true,
          strokeColor: getColor(crowdLevels[i % crowdLevels.length]),
          strokeOpacity: 1.0,
          strokeWeight: 6,
          map
        });
      }

      new google.maps.Marker({
        position: path[0],
        map,
        label: "起",
      });

      new google.maps.Marker({
        position: path[path.length - 1],
        map,
        label: "終",
      });
    } else {
      alert("無法找到路線: " + status);
    }
  });
}

function getColor(level) {
  if (level <= 1) return "#00C853"; // 綠色（人少）
  if (level <= 3) return "#FFD600"; // 黃色（中等）
  return "#D50000"; // 紅色（擁擠）
}

async function estimateCrowdLevels() {
  const now = new Date();
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
  const hour = now.getHours();

  try {
    const res = await fetch("crowd_data.json");
    const data = await res.json();

    // 根據目前時間過濾適合的人流資料
    const matching = data.filter(d => d.weekday === weekday && d.hour === hour);
    if (matching.length > 0) {
      return matching.map(d => d.crowdLevel);
    } else {
      return [2, 2, 2, 2]; // 沒資料時給中等人流預設值
    }
  } catch (error) {
    console.error("無法讀取crowd_data.json", error);
    return [2, 2, 2, 2];
  }
}

window.onload = initMap;