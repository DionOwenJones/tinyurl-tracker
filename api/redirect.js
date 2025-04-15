// /api/redirect.js
// Redirects to the original URL, logs click analytics
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getGeo(ip) {
  try {
    const res = await fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`);
    if (!res.ok) return {};
    const data = await res.json();
    if (!data.loc) return {};
    const [latitude, longitude] = data.loc.split(',').map(Number);
    return {
      city: data.city,
      country: data.country,
      latitude,
      longitude
    };
  } catch {
    return {};
  }
}

module.exports = async (req, res) => {
  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  // Log request
  console.log('Redirect request:', req.query);
  try {
    const { c: shortCode } = req.query;
    if (!shortCode) return res.status(400).json({ error: 'Missing code' });

    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('short_code', shortCode)
      .single();

    if (urlError) throw urlError;
    if (!urlData) return res.status(404).json({ error: 'URL not found' });

    // Get IP and geolocation
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || '';
    const geo = await getGeo(ip);

    // Log click
    const { error: clickError } = await supabase.from('url_clicks').insert({
      url_id: urlData.id,
      ip_address: ip,
      city: geo.city,
      country: geo.country,
      latitude: geo.latitude,
      longitude: geo.longitude,
      user_agent: req.headers['user-agent']
    });

    if (clickError) {
      console.error('Error logging click:', clickError);
      // Continue with redirect even if click logging fails
    }

    // For redirect, don't send JSON
    res.removeHeader('Content-Type');
    res.writeHead(302, { Location: urlData.original_url });
    res.end();
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
