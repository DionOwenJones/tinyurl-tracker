// /api/analytics.js
// Fetch analytics for a short code
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
  try {
    const { shortCode } = req.query;
    if (!shortCode) return res.status(400).json({ error: 'Missing shortCode' });

    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .select('id')
      .eq('short_code', shortCode)
      .single();

    if (urlError) throw urlError;
    if (!urlData) return res.status(404).json({ error: 'URL not found' });

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
