const fs = require('fs');
const path = require('path');
const winston = require('winston');
const env = require('../config/env');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;
const transports = [];

if (env.isTest) {
  // Silencioso en tests: no ensucia la salida ni crea archivos.
  transports.push(new winston.transports.Console({ silent: true }));
} else {
  const logsDir = path.resolve(env.LOG_DIR);
  fs.mkdirSync(logsDir, { recursive: true });
  transports.push(
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') })
  );
}

// Consola solo en desarrollo.
if (env.isDevelopment) {
  const devFormat = printf(({ level, message, timestamp: ts, stack, service, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} ${level}: ${message}${extra}${stack ? `\n${stack}` : ''}`;
  });
  transports.push(
    new winston.transports.Console({ format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat) })
  );
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: 'shipnow-api' },
  transports,
});

module.exports = logger;
