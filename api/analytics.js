// /api/analytics.js
// Get analytics for a shortened URL
const { createClient } = require('@supabase/supabase-js');
const logger = require('./utils/logger');

module.exports = async (req, res) => {
  logger.info('Analytics request received', JSON.stringify({
    shortCode: req.query.shortCode,
    method: req.method
  }));

  try {
    // Set JSON content type and CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { shortCode } = req.query;

    if (!shortCode) {
      return res.status(400).json({ error: 'Missing shortCode parameter' });
    }

    // Initialize Supabase
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Get clicks data
    logger.info('Fetching clicks', JSON.stringify({ shortCode }));
    const { data, error } = await supabase
      .from('clicks')
      .select('*')
      .eq('short_code', shortCode);

    if (error) {
      logger.error('Supabase error', JSON.stringify(error));
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ clicks: data || [] });
  } catch (error) {
    logger.error('Analytics error', JSON.stringify(error));
    res.status(500).json({ error: 'Internal server error' });
  }
};
