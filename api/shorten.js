// /api/shorten.js
// Shorten a URL and store in Supabase
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

function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const handler = async (req, res) => {
  // Enable more detailed error stack traces
  Error.stackTraceLimit = 30;
  // Set JSON content type and CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Request received:', {
      method: req.method,
      headers: req.headers,
      body: req.body,
      url: req.url
    });

    // Initialize Supabase
    console.log('Initializing Supabase...');
    const supabase = initSupabase();
    console.log('Supabase initialized');

    // Basic method check
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse and validate request
    let url;
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      url = body?.url;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid URL' });
      }
      new URL(url); // Validate URL format
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL or request format' });
    }

    // Generate short code
    const shortCode = generateShortCode();

    // Insert URL
    const { data, error } = await supabase
      .from('urls')
      .insert({ original_url: url, short_code: shortCode })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Return shortened URL
    const host = req.headers['origin'] || req.headers['host'] || '';
    const shortUrl = `${host.replace(/\/$/, '')}/api/redirect?c=${shortCode}`;
    return res.status(200).json({ shortUrl, shortCode });

  } catch (error) {
    // Let the error handler middleware handle it
    throw error;
  }
};

// Export handler with error handling middleware
module.exports = errorHandler(handler);
