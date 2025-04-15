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
    const res = await fetch(`${API_BASE}/analytics?shortCode=${encodeURIComponent(shortCode)}`);
    const data = await res.json();
    
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

// Initialize Mapbox with your access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZGlvbm93ZW5qb25lcyIsImEiOiJjbG9iZmV4ZHAwMDJqMmtvOWxjbmJxcnB4In0.xtUHvlLHXQwGO0GWYFyAEw';

function showMap(clicks) {
  // Clear existing map if it exists
  if (map) {
    map.remove();
    map = null;
  }

  // Create new map
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [0, 20],
    zoom: 1.5
  });

  // Add navigation controls
  map.addControl(new mapboxgl.NavigationControl());

  // Wait for map to load before adding data
  map.on('load', () => {
    // Add a data source for clicks
    const geojson = {
      type: 'FeatureCollection',
      features: clicks.filter(click => click.latitude && click.longitude).map(click => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [click.longitude, click.latitude]
        },
        properties: {
          city: click.city || 'Unknown City',
          country: click.country || 'Unknown Country',
          date: new Date(click.clicked_at).toLocaleString()
        }
      }))
    };

    // Add the data source
    map.addSource('clicks', {
      type: 'geojson',
      data: geojson
    });

    // Add a heatmap layer
    map.addLayer({
      id: 'clicks-heat',
      type: 'heatmap',
      source: 'clicks',
      maxzoom: 15,
      paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': 1,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': 20,
        'heatmap-opacity': 0.8
      }
    });

    // Add a symbol layer for points
    map.addLayer({
      id: 'clicks-point',
      type: 'circle',
      source: 'clicks',
      minzoom: 7,
      paint: {
        'circle-radius': 6,
        'circle-color': '#ff4081',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add popups
    map.on('click', 'clicks-point', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const { city, country, date } = e.features[0].properties;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <strong>${city}, ${country}</strong><br>
          ${date}
        `)
        .addTo(map);
    });

    // Change cursor on hover
    map.on('mouseenter', 'clicks-point', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'clicks-point', () => {
      map.getCanvas().style.cursor = '';
    });

    // Fit map to data
    if (geojson.features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      geojson.features.forEach(feature => {
        bounds.extend(feature.geometry.coordinates);
      });
      map.fitBounds(bounds, { padding: 50 });
    }
  });
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

