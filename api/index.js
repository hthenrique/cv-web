let app;

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-UUID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!app) {
      app = require('./server/index');
    }
    return app(req, res);
  } catch (err) {
    console.error('Vercel root serverless error:', err);
    return res.status(500).json({
      error: 'SERVERLESS_ROOT_LOAD_ERROR',
      message: err.message,
      stack: err.stack,
      node: process.version,
      platform: process.platform,
      arch: process.arch
    });
  }
};
