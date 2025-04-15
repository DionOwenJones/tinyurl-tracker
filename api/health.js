// /api/health.js
// Simple health check endpoint
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    // Log environment variables (redacted)
    console.log('Environment variables:', {
      SUPABASE_URL: process.env.SUPABASE_URL ? '[REDACTED]' : 'undefined',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '[REDACTED]' : 'undefined'
    });

    // Return basic status
    res.status(200).json({
      status: 'ok',
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'missing',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'missing'
      },
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
