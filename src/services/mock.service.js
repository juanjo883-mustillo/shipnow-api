const { fakerES: faker } = require('@faker-js/faker');
const userRepository = require('../repositories/user.repository');
const shipmentRepository = require('../repositories/shipment.repository');
const logger = require('../utils/logger');
const { InvalidMockQuantityError } = require('../errors');
const {
  MOCK_LIMITS, USER_ROLES, CITIES, SHIPMENT_STATUS, TRACKING_PREFIX,
} = require('../constants');

const HAPPY_PATH = ['created', 'in_transit', 'out_for_delivery', 'delivered'];

function validateQuantity(value, label = 'quantity') {
  const quantity = Number(value);
  if (value === undefined || value === '' || !Number.isInteger(quantity) ||
      quantity < MOCK_LIMITS.MIN || quantity > MOCK_LIMITS.MAX) {
    throw new InvalidMockQuantityError(
      `'${label}' debe ser un entero entre ${MOCK_LIMITS.MIN} y ${MOCK_LIMITS.MAX}`
    );
  }
  return quantity;
}

function generateUsers(quantity) {
  const total = validateQuantity(quantity);
  return Array.from({ length: total }, (_, i) => {
    const name = faker.person.fullName();
    const slug = name.normalize('NFD').replace(/[^a-zA-Z ]/g, '').trim().toLowerCase().replace(/\s+/g, '.');
    return {
      name,
      email: `${slug}.${Date.now().toString(36)}${i}@example.com`,
      phone: faker.phone.number(),
      role: faker.helpers.arrayElement(USER_ROLES),
    };
  });
}

// El historial es coherente con el estado final (respeta STATUS_TRANSITIONS).
function buildHistory(status) {
  const steps = status === SHIPMENT_STATUS.CANCELLED
    ? faker.helpers.arrayElement([['created', 'cancelled'], ['created', 'in_transit', 'cancelled']])
    : HAPPY_PATH.slice(0, HAPPY_PATH.indexOf(status) + 1);
  let at = faker.date.recent({ days: 10 });
  return steps.map((step) => {
    at = new Date(at.getTime() + 60 * 60 * 1000);
    return { status: step, note: `Estado: ${step}`, at };
  });
}

function generateShipments(quantity, senderIds) {
  const total = validateQuantity(quantity);
  return Array.from({ length: total }, (_, i) => {
    const status = faker.helpers.arrayElement(Object.values(SHIPMENT_STATUS));
    const history = buildHistory(status);
    return {
      trackingCode: `${TRACKING_PREFIX}-${faker.string.hexadecimal({ length: 10, casing: 'upper', prefix: '' })}`,
      sender: senderIds ? senderIds[i % senderIds.length] : faker.database.mongodbObjectId(),
      recipient: {
        name: faker.person.fullName(),
        address: faker.location.streetAddress(),
        city: faker.helpers.arrayElement(CITIES),
        phone: faker.phone.number(),
      },
      description: faker.commerce.productName(),
      weightKg: Number(faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 })),
      status,
      history,
      ...(status === SHIPMENT_STATUS.DELIVERED ? { deliveredAt: history[history.length - 1].at } : {}),
    };
  });
}

// Persiste usuarios y envíos simulados (envíos repartidos entre los usuarios creados).
async function generateAndPersist({ users, shipments }) {
  const usersQty = validateQuantity(users, 'users');
  const shipmentsQty = validateQuantity(shipments, 'shipments');
  const createdUsers = await userRepository.insertMany(generateUsers(usersQty));
  const senderIds = createdUsers.map((u) => u.id);
  await shipmentRepository.insertMany(generateShipments(shipmentsQty, senderIds));
  logger.info('Mocks generados', { users: usersQty, shipments: shipmentsQty });
  return { users: usersQty, shipments: shipmentsQty };
}

module.exports = { validateQuantity, generateUsers, generateShipments, generateAndPersist };
