const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

mongoose.connection.on('error', (err) => logger.error('Error de conexión a MongoDB', { message: err.message }));
mongoose.connection.on('disconnected', () => logger.warn('MongoDB desconectado'));

async function connectDatabase(uri = env.MONGO_URI) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
  logger.info('Conectado a MongoDB', { database: mongoose.connection.name });
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
