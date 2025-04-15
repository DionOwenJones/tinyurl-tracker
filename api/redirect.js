// /api/redirect.js
// Redirect to original URL and track click
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  try {
    const { c: shortCode } = req.query;

    if (!shortCode) {
      return res.status(400).json({ error: 'Missing shortCode parameter' });
    }

    // Initialize Supabase
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Get original URL
    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .select('original_url')
      .eq('short_code', shortCode)
      .single();

    if (urlError) {
      console.error('URL lookup error:', urlError);
      return res.status(500).json({ error: urlError.message });
    }

    if (!urlData) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Get visitor's IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // Log the click
    const { error: clickError } = await supabase
      .from('clicks')
      .insert({
        short_code: shortCode,
        ip_address: ip,
        user_agent: req.headers['user-agent'],
        referrer: req.headers['referer'] || null
      });

    if (clickError) {
      console.error('Error logging click:', clickError);
      // Continue with redirect even if logging fails
    }

    // Redirect to original URL
    res.setHeader('Location', urlData.original_url);
    return res.status(307).end();

  } catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).json({ error: error.message });
  }
};
