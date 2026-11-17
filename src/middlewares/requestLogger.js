const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
    logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, {
      method: req.method, url: req.originalUrl, statusCode: res.statusCode, durationMs: Number(ms.toFixed(1)),
    });
  });
  next();
};
