// Error handling middleware
const errorHandler = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (error) {
    // Log error details
    const errorInfo = {
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n'),
        code: error.code,
        details: error.details,
        supabaseError: error.error // Supabase specific error details
      }
    };

    // Log the full error context
    console.error('API Error:', JSON.stringify(errorInfo, null, 2));

    // Send detailed error response
    res.status(500).json({
      error: {
        message: error.message,
        type: error.name,
        code: error.code || 500,
        details: error.details || error.error // Include Supabase error details
      }
    });
  }
};

module.exports = { errorHandler };
