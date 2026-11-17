// Configuración centralizada: es el único lugar que lee process.env.
require('dotenv').config({ quiet: true });

const NODE_ENV = process.env.NODE_ENV || 'development';
const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return value === undefined || value === '' || Number.isNaN(parsed) ? fallback : parsed;
};

const env = {
  NODE_ENV,
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test',
  PORT: toNumber(process.env.PORT, 3000),
  // En tests se usa SIEMPRE una base independiente.
  MONGO_URI:
    NODE_ENV === 'test'
      ? process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/shipnow_test'
      : process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shipnow',
  LOG_LEVEL: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug'),
  LOG_DIR: process.env.LOG_DIR || 'logs',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_MB: toNumber(process.env.MAX_FILE_SIZE_MB, 5),
  RATE_LIMIT_MAX: toNumber(process.env.RATE_LIMIT_MAX, 100),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || '',
  DEFAULT_INTERNAL_KEY: 'change-me-in-production',
};

if (env.isProduction && !env.INTERNAL_API_KEY) {
  throw new Error('INTERNAL_API_KEY es obligatoria en producción');
}

module.exports = env;
