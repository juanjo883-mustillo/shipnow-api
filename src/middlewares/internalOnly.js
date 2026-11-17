const env = require('../config/env');
const { UnauthorizedError } = require('../errors');

// Protege endpoints internos (mocks, logger). En producción siempre exige la clave;
// en otros ambientes solo si INTERNAL_API_KEY está definida.
module.exports = (req, res, next) => {
  if (!env.isProduction && !env.INTERNAL_API_KEY) return next();
  if (!env.INTERNAL_API_KEY || req.get('x-internal-key') !== env.INTERNAL_API_KEY) {
    return next(new UnauthorizedError('Se requiere un header x-internal-key válido'));
  }
  return next();
};
