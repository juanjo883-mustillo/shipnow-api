const healthService = require('../services/health.service');

exports.check = (req, res) => {
  const { httpStatus, body } = healthService.getHealth();
  res.status(httpStatus).json(body);
};
