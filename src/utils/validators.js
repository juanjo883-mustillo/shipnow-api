const { ValidationError } = require('../errors');
const { PAGINATION } = require('../constants');

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

function assertObjectId(value, label = 'id') {
  if (typeof value !== 'string' || !OBJECT_ID_REGEX.test(value)) {
    throw new ValidationError(`El campo '${label}' no es un identificador válido`);
  }
  return value;
}

function parsePagination(query = {}) {
  const page = query.page === undefined ? PAGINATION.DEFAULT_PAGE : Number(query.page);
  const limit = query.limit === undefined ? PAGINATION.DEFAULT_LIMIT : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError("El parámetro 'page' debe ser un entero mayor o igual a 1");
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new ValidationError("El parámetro 'limit' debe ser un entero mayor o igual a 1");
  }
  return { page, limit: Math.min(limit, PAGINATION.MAX_LIMIT) }; // tope: evita respuestas gigantes
}

const buildMeta = (page, limit, total) => ({
  page, limit, total, totalPages: Math.ceil(total / limit),
});

module.exports = { assertObjectId, parsePagination, buildMeta };
