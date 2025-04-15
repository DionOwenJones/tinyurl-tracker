// /api/analytics.js
// Fetch analytics for a short code
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
  const { shortCode } = req.query;
  if (!shortCode) return res.status(400).json({ error: 'Missing shortCode' });
  const { data: urlData } = await supabase.from('urls').select('id').eq('short_code', shortCode).single();
  if (!urlData) return res.status(404).json({ error: 'Not found' });
  const { data: analytics, error } = await supabase.from('url_clicks').select('*').eq('url_id', urlData.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ analytics });
};
