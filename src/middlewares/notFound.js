const { NotFoundError } = require('../errors');

module.exports = (req, res, next) => next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
