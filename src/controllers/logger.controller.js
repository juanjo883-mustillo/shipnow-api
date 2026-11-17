const logger = require('../utils/logger');
const { success } = require('../utils/response');

const LEVELS = ['error', 'warn', 'info', 'http', 'debug'];

exports.test = (req, res) => {
  LEVELS.forEach((level) => logger.log(level, `Mensaje de prueba de nivel ${level}`, { origin: 'logger-test' }));
  res.json(success({ levelsEmitted: LEVELS, activeLevel: logger.level }));
};
