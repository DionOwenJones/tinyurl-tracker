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
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

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

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) exists = false;
      else {
        shortCode = generateShortCode();
        attempts++;
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique short code');
    }

    const { data, error } = await supabase
      .from('urls')
      .insert({ original_url: url, short_code: shortCode })
      .select()
      .single();

    if (error) throw error;

    // Return the full short URL
    const host = req.headers['origin'] || req.headers['host'] || '';
    const shortUrl = `${host.replace(/\/$/, '')}/api/redirect?c=${shortCode}`;
    res.status(200).json({ shortUrl, shortCode });
  } catch (error) {
    console.error('Shorten error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
