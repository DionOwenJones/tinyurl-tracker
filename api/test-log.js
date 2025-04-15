// Simple test endpoint to verify logging
module.exports = async (req, res) => {
  console.log('Test log - this should appear in runtime logs');
  console.error('Test error log - this should also appear');
  
  return res.status(200).json({
    message: 'Test endpoint called successfully',
    time: new Date().toISOString(),
    query: req.query,
    headers: req.headers
  });
};
