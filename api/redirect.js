// /api/redirect.js
// Redirect to original URL and track click
const { createClient } = require('@supabase/supabase-js');
const { errorHandler } = require('./middleware');

// Initialize Supabase
const initSupabase = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase credentials');
  }

  try {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  } catch (error) {
    console.error('Supabase initialization error:', error);
    throw new Error(`Failed to initialize Supabase: ${error.message}`);
  }
};

// Get geolocation data
const getGeo = async (ip) => {
  try {
    // Get geolocation data using ip-api.com (free, no API key needed)
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await res.json();
    return {
      country: data.country,
      region: data.regionName,
      city: data.city,
      lat: data.lat,
      lon: data.lon
    };
  } catch (error) {
    console.error('Geolocation error:', error);
    return null;
  }
};

const handler = async (req, res) => {
  try {
    const { c: shortCode } = req.query;

    if (!shortCode) {
      return res.status(400).json({ error: 'Missing shortCode parameter' });
    }

    // Initialize Supabase
    const supabase = initSupabase();

    // Get original URL
    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .select('original_url')
      .eq('short_code', shortCode)
      .single();

    if (urlError) throw urlError;
    if (!urlData) return res.status(404).json({ error: 'URL not found' });

    // Get visitor's IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    
    // Get geolocation data
    const geoData = await getGeo(ip);

    // Log the click
    const { error: clickError } = await supabase
      .from('clicks')
      .insert({
        short_code: shortCode,
        ip_address: ip,
        user_agent: req.headers['user-agent'],
        referrer: req.headers['referer'] || null,
        ...geoData
      });

    if (clickError) {
      console.error('Error logging click:', clickError);
      // Continue with redirect even if logging fails
    }

    // Redirect to original URL
    res.setHeader('Location', urlData.original_url);
    return res.status(307).end();

    res.end();
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
