// Structured logger for Vercel
const logger = {
  info: (...args) => console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message: args.join(' ') })),
  error: (...args) => console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), message: args.join(' ') }))
};

module.exports = logger;
