const SHIPMENT_STATUS = Object.freeze({
  CREATED: 'created',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

// Transiciones de estado permitidas para un envío.
const STATUS_TRANSITIONS = Object.freeze({
  created: ['in_transit', 'cancelled'],
  in_transit: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'in_transit'],
  delivered: [],
  cancelled: [],
});

const TERMINAL_STATUSES = Object.freeze(['delivered', 'cancelled']);
const DELETABLE_STATUSES = Object.freeze(['created', 'cancelled']);
const USER_ROLES = Object.freeze(['customer', 'courier', 'admin']);

const UPLOAD_KINDS = Object.freeze({ DOCUMENT: 'documents', RECEIPT: 'receipts' });
const ALLOWED_MIME_TYPES = Object.freeze({
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
});

const MOCK_LIMITS = Object.freeze({ MIN: 1, MAX: 100 });
const PAGINATION = Object.freeze({ DEFAULT_PAGE: 1, DEFAULT_LIMIT: 10, MAX_LIMIT: 50 });
const TRACKING_PREFIX = 'SN';
const RECIPIENT_FIELDS = Object.freeze(['name', 'address', 'city', 'phone']);

const CITIES = Object.freeze([
  'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata',
  'Tucumán', 'Mar del Plata', 'Salta', 'Santa Fe', 'Neuquén',
]);

module.exports = {
  SHIPMENT_STATUS, STATUS_TRANSITIONS, TERMINAL_STATUSES, DELETABLE_STATUSES,
  USER_ROLES, UPLOAD_KINDS, ALLOWED_MIME_TYPES, MOCK_LIMITS, PAGINATION,
  TRACKING_PREFIX, RECIPIENT_FIELDS, CITIES,
};
