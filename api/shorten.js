// /api/shorten.js
// Shorten a URL and store in Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

module.exports = async (req, res) => {
  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  // Log request
  console.log('Request body:', req.body);
  try {
    // Check method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid URL' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    let shortCode = generateShortCode();
    let exists = true;
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure unique short code
    while (exists && attempts < maxAttempts) {
      const { data, error } = await supabase
        .from('urls')
        .select('id')
        .eq('short_code', shortCode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, which is what we want
          exists = false;
        } else {
          console.error('Database error:', error);
          throw error;
        }
      } else if (data) {
        shortCode = generateShortCode();
        attempts++;
      } else {
        exists = false;
      }
    }

    if (attempts >= maxAttempts) {
      return res.status(500).json({ error: 'Failed to generate unique short code' });
    }

    // Insert the new URL
    const { data, error } = await supabase
      .from('urls')
      .insert({ original_url: url, short_code: shortCode })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    if (!data) {
      return res.status(500).json({ error: 'Failed to create short URL' });
    }

    // Return the full short URL
    const host = req.headers['origin'] || req.headers['host'] || '';
    const shortUrl = `${host.replace(/\/$/, '')}/api/redirect?c=${shortCode}`;
    return res.status(200).json({ shortUrl, shortCode });
  } catch (error) {
    console.error('Shorten error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
