// --- CONFIG ---
const API_BASE = "/api"; // Vercel/Netlify serverless API base

// --- DOM Elements ---
const form = document.getElementById('shorten-form');
const urlInput = document.getElementById('url-input');
const resultDiv = document.getElementById('result');
const shortUrlA = document.getElementById('short-url');
const analyticsDiv = document.getElementById('analytics');
const clickCountP = document.getElementById('click-count');
const mapDiv = document.getElementById('map');
let map, markers = [];

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const originalUrl = urlInput.value.trim();
  if (!originalUrl) return;
  resultDiv.classList.add('hidden');
  analyticsDiv.classList.add('hidden');
  shortUrlA.textContent = '';
  shortUrlA.href = '#';
  
  // Call backend to shorten URL
  const res = await fetch(`${API_BASE}/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: originalUrl })
  });
  const data = await res.json();
  if (data.shortUrl) {
    shortUrlA.textContent = data.shortUrl;
    shortUrlA.href = data.shortUrl;
    resultDiv.classList.remove('hidden');
    // Fetch analytics for new link
    fetchAnalytics(data.shortCode);
  } else {
    shortUrlA.textContent = 'Error: ' + (data.error || 'Unknown error');
    resultDiv.classList.remove('hidden');
  }
});

async function fetchAnalytics(shortCode) {
  const res = await fetch(`${API_BASE}/analytics?shortCode=${encodeURIComponent(shortCode)}`);
  const data = await res.json();
  if (data.analytics) {
    clickCountP.textContent = `Total Clicks: ${data.analytics.length}`;
    showMap(data.analytics);
    analyticsDiv.classList.remove('hidden');
  } else {
    clickCountP.textContent = 'No analytics data.';
    analyticsDiv.classList.remove('hidden');
  }
}

function showMap(clicks) {
  if (!map) {
    map = L.map(mapDiv).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  }
  // Remove old markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  clicks.forEach(click => {
    if (click.latitude && click.longitude) {
      const marker = L.marker([click.latitude, click.longitude])
        .addTo(map)
        .bindPopup(`${click.city || 'Unknown'}, ${click.country || ''}`);
      markers.push(marker);
    }
  });
}
