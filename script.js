// Initialize map function - must be defined before Google Maps loads
window.initMap = function() {
  window.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 2,
    center: { lat: 20, lng: 0 },
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#515c6d' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#17263c' }]
      }
    ]
  });
};

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
    console.log('Shortening URL:', originalUrl);
    const res = await fetch(`${API_BASE}/shorten`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ url: originalUrl })
    });

    let data;
    try {
      const text = await res.text();
      console.log('Raw response:', text);
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error('Server returned invalid JSON');
    }

    if (!res.ok) {
      console.error('Server error:', data);
      const errorMessage = data.details?.message || data.error?.message || data.message || 'An unknown error occurred';
      showError(`Error: ${errorMessage}`);
    }

    if (data.shortUrl) {
      shortUrlA.textContent = data.shortUrl;
      shortUrlA.href = data.shortUrl;
      resultDiv.classList.remove('hidden');
      urlInput.value = ''; // Clear input
      fetchAnalytics(data.shortCode);
    } else {
      console.error('Invalid response:', data);
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
    console.log('Fetching analytics for shortCode:', shortCode);
    const res = await fetch(`${API_BASE}/analytics?shortCode=${encodeURIComponent(shortCode)}`);
    const data = await res.json();
    console.log('Received analytics data:', data);
    
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch analytics');
    }
    
    if (data.clicks) {
      updateAnalytics(data.clicks);
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

// Global variables for map state
let heatmap = null;
markers = [];



function showMap(clicks) {
  console.log('Showing map with clicks:', clicks);

  // Clear existing markers
  if (markers) {
    markers.forEach(marker => marker.setMap(null));
  }
  markers = [];
  
  // Clear existing heatmap
  if (heatmap) {
    heatmap.setMap(null);
  }

  // Filter valid clicks with coordinates
  const validClicks = clicks.filter(click => click.latitude && click.longitude);
  console.log('Valid clicks with coordinates:', validClicks);

  // Wait for map to be initialized
  if (!window.map) {
    console.log('Map not initialized yet');
    return;
  }

  // Create heatmap layer
  const heatmapData = validClicks.map(click => {
    return {
      location: new google.maps.LatLng(click.latitude, click.longitude),
      weight: 1
    };
  });

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    map: window.map,
    radius: 30,
    opacity: 0.7,
    gradient: [
      'rgba(0, 0, 0, 0)',
      'rgba(0, 255, 255, 1)',
      'rgba(0, 191, 255, 1)',
      'rgba(0, 127, 255, 1)',
      'rgba(0, 63, 255, 1)',
      'rgba(0, 0, 255, 1)',
      'rgba(0, 0, 223, 1)',
      'rgba(0, 0, 191, 1)',
      'rgba(0, 0, 159, 1)',
      'rgba(0, 0, 127, 1)',
      'rgba(63, 0, 91, 1)',
      'rgba(127, 0, 63, 1)',
      'rgba(191, 0, 31, 1)',
      'rgba(255, 0, 0, 1)'
    ]
  });
  
  // Force the heatmap to redraw
  heatmap.setMap(null);
  heatmap.setMap(window.map);

  // Add markers with info windows
  validClicks.forEach(click => {
    const marker = new google.maps.Marker({
      position: { lat: click.latitude, lng: click.longitude },
      map: window.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#ff4081',
        fillOpacity: 0.9,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      },
      title: `${click.city || 'Unknown City'}, ${click.country || 'Unknown Country'}`
    });

    const infowindow = new google.maps.InfoWindow({
      content: `
        <div class="popup-content">
          <strong>${click.city || 'Unknown City'}, ${click.country || 'Unknown Country'}</strong><br>
          <small>${new Date(click.clicked_at).toLocaleString()}</small>
        </div>
      `
    });

    marker.addListener('click', () => {
      infowindow.open(window.map, marker);
    });

    markers.push(marker);
  });

  // Fit bounds if we have markers
  if (validClicks.length > 0) {
    const bounds = new google.maps.LatLngBounds();
    validClicks.forEach(click => {
      bounds.extend({ lat: click.latitude, lng: click.longitude });
    });
    window.map.fitBounds(bounds);
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

