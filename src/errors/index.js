class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') { super(message, 404, 'NOT_FOUND'); }
}
class ValidationError extends AppError {
  constructor(message = 'Datos inválidos', details) { super(message, 400, 'INVALID_DATA', details); }
}
class InvalidStateError extends AppError {
  constructor(message = 'Estado inválido para esta operación') { super(message, 409, 'INVALID_STATE'); }
}
class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe') { super(message, 409, 'CONFLICT'); }
}
class FileRequiredError extends AppError {
  constructor(message = 'Se requiere un archivo') { super(message, 400, 'FILE_REQUIRED'); }
}
class InvalidFileTypeError extends AppError {
  constructor(message = 'Tipo de archivo inválido') { super(message, 415, 'INVALID_FILE_TYPE'); }
}
class FileTooLargeError extends AppError {
  constructor(message = 'El archivo supera el tamaño máximo permitido') { super(message, 413, 'FILE_TOO_LARGE'); }
}
class InvalidMockQuantityError extends AppError {
  constructor(message = 'Cantidad de mocks inválida') { super(message, 400, 'INVALID_MOCK_QUANTITY'); }
}
class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') { super(message, 401, 'UNAUTHORIZED'); }
}

module.exports = {
  AppError, NotFoundError, ValidationError, InvalidStateError, ConflictError,
  FileRequiredError, InvalidFileTypeError, FileTooLargeError,
  InvalidMockQuantityError, UnauthorizedError,
};
