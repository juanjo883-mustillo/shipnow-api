const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const { SHIPMENT_STATUS, USER_ROLES, ALLOWED_MIME_TYPES, MOCK_LIMITS } = require('../constants');

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ 'application/json': { schema } });
const ok = (description, data, withMeta = false) => ({
  description,
  content: json({
    type: 'object',
    properties: {
      status: { type: 'string', example: 'success' },
      data,
      ...(withMeta ? { meta: ref('Pagination') } : {}),
    },
  }),
});
const err = (description, code) => ({
  description,
  content: { 'application/json': { schema: ref('Error'), example: { status: 'error', error: { code, message: description } } } },
});

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'ShipNow API',
    version: '1.0.0',
    description: 'API backend de ShipNow: usuarios, envíos, tracking, carga de archivos y utilidades internas.',
  },
  servers: [{ url: '/', description: 'Servidor actual' }],
  tags: [
    { name: 'Usuarios' }, { name: 'Envíos' }, { name: 'Tracking' },
    { name: 'Mocks', description: 'Endpoints internos' }, { name: 'Logger', description: 'Endpoints internos' },
    { name: 'Health' },
  ],
  components: {
    securitySchemes: {
      InternalApiKey: { type: 'apiKey', in: 'header', name: 'x-internal-key', description: 'Requerida en endpoints internos cuando INTERNAL_API_KEY está definida (siempre en producción).' },
    },
    parameters: {
      IdParam: { name: 'id', in: 'path', required: true, description: 'ObjectId de MongoDB', schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$', example: '665f1c2e8b3a4c0012a1b2c3' } },
      PageParam: { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
      LimitParam: { name: 'limit', in: 'query', description: 'Máximo 50', schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } },
      QuantityParam: { name: 'quantity', in: 'query', required: true, schema: { type: 'integer', minimum: MOCK_LIMITS.MIN, maximum: MOCK_LIMITS.MAX } },
    },
    schemas: {
      FileMetadata: {
        type: 'object',
        properties: {
          id: { type: 'string' }, originalName: { type: 'string', example: 'dni.pdf' },
          filename: { type: 'string', example: '0b6e...c1.pdf' }, mimeType: { type: 'string', enum: Object.keys(ALLOWED_MIME_TYPES) },
          size: { type: 'integer', description: 'Bytes' }, path: { type: 'string', example: 'documents/0b6e...c1.pdf' },
          uploadedAt: { type: 'string', format: 'date-time' },
        },
      },
      UserInput: {
        type: 'object', required: ['name', 'email'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 80, example: 'Ana Pérez' },
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          phone: { type: 'string', example: '+54 11 5555-1234' },
          role: { type: 'string', enum: USER_ROLES, default: 'customer' },
        },
      },
      User: {
        allOf: [ref('UserInput'), {
          type: 'object',
          properties: {
            id: { type: 'string', example: '665f1c2e8b3a4c0012a1b2c3' },
            documents: { type: 'array', items: ref('FileMetadata') },
            createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
          },
        }],
      },
      Recipient: {
        type: 'object', required: ['name', 'address', 'city'],
        properties: {
          name: { type: 'string', example: 'Luis Gómez' }, address: { type: 'string', example: 'Av. Siempre Viva 742' },
          city: { type: 'string', example: 'Rosario' }, phone: { type: 'string' },
        },
      },
      ShipmentInput: {
        type: 'object', required: ['sender', 'recipient', 'weightKg'],
        properties: {
          sender: { type: 'string', description: 'Id de un usuario existente' },
          recipient: ref('Recipient'),
          description: { type: 'string', maxLength: 200, example: 'Caja con libros' },
          weightKg: { type: 'number', minimum: 0.01, maximum: 1000, example: 2.5 },
        },
      },
      HistoryEntry: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: Object.values(SHIPMENT_STATUS) },
          note: { type: 'string' }, at: { type: 'string', format: 'date-time' },
        },
      },
      Shipment: {
        type: 'object',
        properties: {
          id: { type: 'string' }, trackingCode: { type: 'string', example: 'SN-A1B2C3D4E5' },
          sender: { description: 'Id del remitente (en el detalle viene con name y email)', oneOf: [{ type: 'string' }, { type: 'object' }] },
          recipient: ref('Recipient'), description: { type: 'string' }, weightKg: { type: 'number' },
          status: { type: 'string', enum: Object.values(SHIPMENT_STATUS) },
          history: { type: 'array', items: ref('HistoryEntry') },
          receipts: { type: 'array', items: ref('FileMetadata') },
          deliveredAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      StatusUpdate: {
        type: 'object', required: ['status'],
        properties: { status: { type: 'string', enum: Object.values(SHIPMENT_STATUS) }, note: { type: 'string', maxLength: 200 } },
      },
      TrackingInfo: {
        type: 'object',
        properties: {
          trackingCode: { type: 'string' }, status: { type: 'string', enum: Object.values(SHIPMENT_STATUS) },
          destinationCity: { type: 'string' }, history: { type: 'array', items: ref('HistoryEntry') },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } },
      },
      SuccessResponse: {
        type: 'object',
        properties: { status: { type: 'string', example: 'success' }, data: { description: 'Payload de la respuesta' }, meta: ref('Pagination') },
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND', description: 'NOT_FOUND, INVALID_DATA, INVALID_STATE, CONFLICT, FILE_REQUIRED, INVALID_FILE_TYPE, FILE_TOO_LARGE, INVALID_MOCK_QUANTITY, UNAUTHORIZED, INTERNAL_ERROR' },
              message: { type: 'string' },
              details: { type: 'object', additionalProperties: { type: 'string' } },
            },
          },
        },
      },
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'] }, uptime: { type: 'integer', description: 'Segundos' },
          timestamp: { type: 'string', format: 'date-time' }, environment: { type: 'string' },
          database: { type: 'string', example: 'connected' },
        },
      },
    },
    responses: {
      UserOk: ok('Operación exitosa', ref('User')),
      UserList: ok('Listado paginado de usuarios', { type: 'array', items: ref('User') }, true),
      ShipmentOk: ok('Operación exitosa', ref('Shipment')),
      ShipmentList: ok('Listado paginado de envíos (sin history ni receipts)', { type: 'array', items: ref('Shipment') }, true),
      TrackingOk: ok('Información pública de seguimiento', ref('TrackingInfo')),
      FileOk: ok('Archivo cargado; metadatos guardados', ref('FileMetadata')),
      MockUsersOk: ok('Usuarios simulados (no se guardan)', { type: 'array', items: ref('UserInput') }),
      MockShipmentsOk: ok('Envíos simulados (no se guardan)', { type: 'array', items: ref('Shipment') }),
      MockGenerated: ok('Mocks persistidos', { type: 'object', properties: { users: { type: 'integer' }, shipments: { type: 'integer' } } }),
      BadRequest: err('Datos inválidos', 'INVALID_DATA'),
      Unauthorized: err('No autorizado', 'UNAUTHORIZED'),
      NotFound: err('Recurso no encontrado', 'NOT_FOUND'),
      Conflict: err('Conflicto o estado inválido', 'INVALID_STATE'),
      PayloadTooLarge: err('El archivo supera el tamaño máximo permitido', 'FILE_TOO_LARGE'),
      UnsupportedMediaType: err('Tipo de archivo inválido', 'INVALID_FILE_TYPE'),
    },
  },
};

module.exports = swaggerJsdoc({
  definition,
  apis: [path.join(__dirname, '../routes/*.js')],
});
