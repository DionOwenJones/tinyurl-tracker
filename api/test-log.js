// Simple test endpoint to verify logging
const logger = {
  info: (...args) => console.log(JSON.stringify({ level: 'info', message: args.join(' ') })),
  error: (...args) => console.error(JSON.stringify({ level: 'error', message: args.join(' ') }))
};

module.exports = async (req, res) => {
  logger.info('Test log - this should appear in runtime logs');
  logger.error('Test error log - this should also appear');
  
  // Test structured logging
  logger.info('Request details:', JSON.stringify({
    path: req.url,
    method: req.method,
    headers: req.headers
  }));
  
  return res.status(200).json({
    message: 'Test endpoint called successfully',
    time: new Date().toISOString(),
    query: req.query,
    headers: req.headers
  });
};
