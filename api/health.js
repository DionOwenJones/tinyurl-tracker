// /api/health.js
// Health check endpoint to verify environment and database connection
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    // Check environment variables
    const envStatus = {
      SUPABASE_URL: process.env.SUPABASE_URL ? '✓' : '✗',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✓' : '✗'
    };

    // Try to initialize Supabase
    let dbStatus = 'Not tested';
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        const { data, error } = await supabase.from('urls').select('id').limit(1);
        
        if (error) throw error;
        dbStatus = '✓';
      } catch (e) {
        dbStatus = `✗ (${e.message})`;
      }
    }

    res.status(200).json({
      status: 'ok',
      environment: envStatus,
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
};
