// --- CONFIG ---
const API_BASE = "/api";

// --- DOM Elements ---
const shortenForm = document.getElementById('shorten-form');
const trackForm = document.getElementById('track-form');
const urlInput = document.getElementById('url-input');
const trackInput = document.getElementById('track-input');
const resultDiv = document.getElementById('result');
const shortUrlA = document.getElementById('short-url');
const copyBtn = document.getElementById('copy-btn');
const analyticsDiv = document.getElementById('analytics');
const clickCountP = document.getElementById('click-count');
const mapDiv = document.getElementById('map');
let map, markers = [], markerCluster;

// --- Tab Handling ---
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Update active tab
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show corresponding content
    const targetId = `${tab.dataset.tab}-tab`;
    tabContents.forEach(content => {
      content.classList.toggle('hidden', content.id !== targetId);
    });

    // Reset forms and hide results when switching tabs
    shortenForm.reset();
    trackForm.reset();
    resultDiv.classList.add('hidden');
    analyticsDiv.classList.add('hidden');
  });
});

// --- URL Shortening ---
shortenForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const originalUrl = urlInput.value.trim();
  if (!originalUrl) return;

  // UI feedback
  const submitBtn = shortenForm.querySelector('button');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Shortening...';
  resultDiv.classList.add('hidden');
  analyticsDiv.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: originalUrl })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Failed to shorten URL');
    }

    if (data.shortUrl) {
      shortUrlA.textContent = data.shortUrl;
      shortUrlA.href = data.shortUrl;
      resultDiv.classList.remove('hidden');
      urlInput.value = ''; // Clear input
      fetchAnalytics(data.shortCode);
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    showError(error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Shorten URL';
  }
});

// --- URL Tracking ---
trackForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const trackUrl = trackInput.value.trim();
  if (!trackUrl) return;

  // Extract short code from URL
  let shortCode;
  try {
    const url = new URL(trackUrl);
    shortCode = url.searchParams.get('c');
  } catch (e) {
    showError('Invalid URL format');
    return;
  }

  if (!shortCode) {
    showError('Invalid TinyURL format. Make sure to use the full shortened URL.');
    return;
  }

  // UI feedback
  const submitBtn = trackForm.querySelector('button');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Loading...';
  resultDiv.classList.add('hidden');

  try {
    await fetchAnalytics(shortCode);
    trackInput.value = ''; // Clear input
  } catch (error) {
    showError(error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'View Analytics';
  }
});

// --- Copy Link Functionality ---
copyBtn.addEventListener('click', async () => {
  const url = shortUrlA.textContent;
  try {
    await navigator.clipboard.writeText(url);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    copyBtn.style.background = '#00c853';
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
});

// --- Analytics ---
async function fetchAnalytics(shortCode) {
  try {
    const res = await fetch(`${API_BASE}/analytics?shortCode=${encodeURIComponent(shortCode)}`);
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch analytics');
    }
    
    if (data.analytics) {
      updateAnalytics(data.analytics);
    } else {
      throw new Error('No analytics data available');
    }
  } catch (error) {
    console.error('Analytics error:', error);
    clickCountP.textContent = 'No clicks yet';
  }
  analyticsDiv.classList.remove('hidden');
}

function updateAnalytics(clicks) {
  // Update click count
  clickCountP.textContent = `Total Clicks: ${clicks.length}`;
  
  // Update map
  showMap(clicks);

  // Show country breakdown
  const countries = clicks.reduce((acc, click) => {
    if (click.country) {
      acc[click.country] = (acc[click.country] || 0) + 1;
    }
    return acc;
  }, {});
}

// --- Map Visualization ---
function showMap(clicks) {
  if (!map) {
    map = L.map(mapDiv, {
      scrollWheelZoom: false,
      zoomControl: true,
      dragging: !L.Browser.mobile
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);
  }

  // Clear existing markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  // Add new markers with custom styling
  clicks.forEach(click => {
    if (click.latitude && click.longitude) {
      const marker = L.marker([click.latitude, click.longitude], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div class="marker-pulse"></div>',
          iconSize: [10, 10]
        })
      }).addTo(map);

      marker.bindPopup(`
        <div class="popup-content">
          <strong>${click.city || 'Unknown City'}</strong><br>
          ${click.country || 'Unknown Country'}<br>
          <small>${new Date(click.clicked_at).toLocaleString()}</small>
        </div>
      `);

      markers.push(marker);
    }
  });

  // Fit bounds if we have markers
  if (markers.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}

// --- Helper Functions ---
function showError(message) {
  shortUrlA.textContent = `Error: ${message}`;
  shortUrlA.style.color = '#ff3d00';
  resultDiv.classList.remove('hidden');
  setTimeout(() => {
    shortUrlA.style.color = '';
  }, 3000);
}

