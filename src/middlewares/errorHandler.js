const mongoose = require('mongoose');
const multer = require('multer');
const env = require('../config/env');
const logger = require('../utils/logger');
const {
  AppError, ValidationError, ConflictError, FileTooLargeError,
} = require('../errors');

// Convierte cualquier excepción en un AppError con status y código consistentes.
function normalize(err) {
  if (err instanceof AppError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return new ValidationError('Datos inválidos', details);
  }
  if (err instanceof mongoose.Error.CastError) {
    return new ValidationError(`Valor inválido para '${err.path}'`);
  }
  if (err && err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    return new ConflictError(`Ya existe un registro con ese valor${fields ? ` (${fields})` : ''}`);
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new FileTooLargeError(`El archivo supera el máximo de ${env.MAX_FILE_SIZE_MB} MB`);
    }
    return new ValidationError(`Error al subir el archivo: ${err.message}`);
  }
  if (err && err.type === 'entity.parse.failed') return new ValidationError('El cuerpo de la request no es un JSON válido');
  if (err && err.type === 'entity.too.large') return new AppError('El cuerpo de la request es demasiado grande', 413, 'PAYLOAD_TOO_LARGE');

  const wrapped = new AppError(err && err.message ? err.message : 'Error interno del servidor', 500, 'INTERNAL_ERROR');
  wrapped.isOperational = false;
  return wrapped;
}

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const error = normalize(err);
  const isServerError = error.statusCode >= 500;

  logger.log(isServerError ? 'error' : 'warn', error.message, {
    code: error.code,
    statusCode: error.statusCode,
    method: req.method,
    url: req.originalUrl,
    ...(isServerError ? { stack: err.stack } : {}),
  });

  // En producción no se filtran detalles de errores inesperados.
  const message = isServerError && env.isProduction ? 'Error interno del servidor' : error.message;
  return res.status(error.statusCode).json({
    status: 'error',
    error: { code: error.code, message, ...(error.details ? { details: error.details } : {}) },
  });
};
