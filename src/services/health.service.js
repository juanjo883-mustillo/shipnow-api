const mongoose = require('mongoose');
const env = require('../config/env');

const STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

function getHealth() {
  const database = STATES[mongoose.connection.readyState] || 'unknown';
  const healthy = database === 'connected';
  return {
    httpStatus: healthy ? 200 : 503,
    body: {
      status: healthy ? 'ok' : 'degraded',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database,
    },
  };
}

module.exports = { getHealth };
