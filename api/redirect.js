// /api/redirect.js
// Redirect to original URL and track click
const { createClient } = require('@supabase/supabase-js');
const logger = require('./utils/logger');

module.exports = async (req, res) => {
  logger.info('Redirect request received', JSON.stringify({
    shortCode: req.query.c,
    ip: req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    referrer: req.headers['referer']
  }));

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
      logger.error('URL lookup error', JSON.stringify(urlError));
      return res.status(500).json({ error: urlError.message });
    }

    if (!urlData) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Get visitor's IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // Log the click
    console.log('Logging click:', {
      short_code: shortCode,
      ip_address: ip,
      user_agent: req.headers['user-agent'],
      referrer: req.headers['referer'] || null
    });

    const { error: clickError } = await supabase
      .from('clicks')
      .insert({
        short_code: shortCode,
        ip_address: ip,
        user_agent: req.headers['user-agent'],
        referrer: req.headers['referer'] || null
      });

    if (clickError) {
      logger.error('Error logging click', JSON.stringify(clickError));
      // Continue with redirect even if logging fails
    }

    // Make sure URL starts with http:// or https://
    let redirectUrl = urlData.original_url;
    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      redirectUrl = 'https://' + redirectUrl;
    }

    // Redirect to original URL using 302 (temporary redirect)
    res.setHeader('Location', redirectUrl);
    return res.status(302).end();

  } catch (error) {
    logger.error('Redirect error', JSON.stringify(error));
    return res.status(500).json({ error: error.message });
  }
};
