let map;
let crowdData = [];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: { lat: 25.0330, lng: 121.5654 },
  });
  preloadCrowdData();
}

async function preloadCrowdData() {
  try {
    const res = await fetch("crowd_data.json");
    crowdData = await res.json();
  } catch (error) {
    console.error("無法讀取 crowd_data.json", error);
  }
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

      map.setCenter(path[0]);

      for (let i = 0; i < path.length - 1; i++) {
        const midPoint = {
          lat: (path[i].lat() + path[i + 1].lat()) / 2,
          lng: (path[i].lng() + path[i + 1].lng()) / 2
        };

        const level = await getCrowdLevelAt(midPoint);

        const segment = new google.maps.Polyline({
          path: [path[i], path[i + 1]],
          geodesic: true,
          strokeColor: getColor(level),
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

async function getCrowdLevelAt(point) {
  const now = new Date();
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
  const hour = now.getHours();

  // 檢查是否有附近地點符合條件
  const nearby = crowdData.filter(d => d.weekday === weekday && d.hour === hour)
    .map(d => ({
      ...d,
      distance: getDistance(point.lat, point.lng, d.lat, d.lng)
    }))
    .filter(d => d.distance < 0.3); // 300 公尺內視為"附近"

  if (nearby.length > 0) {
    // 取最近的一筆
    nearby.sort((a, b) => a.distance - b.distance);
    return nearby[0].crowdLevel;
  }

  return 2; // 預設中度擁擠
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半徑（公里）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // 回傳公里
}

function toRad(x) {
  return x * Math.PI / 180;
}

window.onload = initMap;
