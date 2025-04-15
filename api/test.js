// Simple test endpoint to verify error handling
const { errorHandler } = require('./middleware');

const handler = async (req, res) => {
  // Log request details
  console.log('Test endpoint called:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    url: req.url
  });

  // Throw a test error
  throw new Error('Test error with details');
};

module.exports = errorHandler(handler);
