// /api/analytics.js
// Get analytics for a shortened URL
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

const handler = async (req, res) => {
  // Set JSON content type and CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log request
  console.log('Analytics request:', req.query);

  try {
    const { shortCode } = req.query;

    if (!shortCode) {
      return res.status(400).json({ error: 'Missing shortCode parameter' });
    }

    // Initialize Supabase
    const supabase = initSupabase();

    // Get URL data
    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .select('id')
      .eq('short_code', shortCode)
      .single();

    if (urlError) throw urlError;
    if (!urlData) return res.status(404).json({ error: 'URL not found' });

    // Get clicks data
    const { data: analytics, error: analyticsError } = await supabase
      .from('url_clicks')
      .select('*')
      .eq('url_id', urlData.id)
      .order('created_at', { ascending: false });

    if (analyticsError) throw analyticsError;

    res.status(200).json({ analytics: analytics || [] });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
