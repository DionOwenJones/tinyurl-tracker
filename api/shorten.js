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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  let shortCode = generateShortCode();
  // Ensure unique short code
  let exists = true;
  while (exists) {
    const { data } = await supabase.from('urls').select('id').eq('short_code', shortCode).single();
    if (!data) exists = false;
    else shortCode = generateShortCode();
  }
  const { data, error } = await supabase.from('urls').insert({ original_url: url, short_code: shortCode }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  // Return the full short URL
  const host = req.headers['origin'] || req.headers['host'] || '';
  const shortUrl = `${host.replace(/\/$/, '')}/api/redirect?c=${shortCode}`;
  res.status(200).json({ shortUrl, shortCode });
};
