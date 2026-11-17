const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const env = require('../src/config/env');

const api = () => request(app);

let counter = 0;
const userPayload = (overrides = {}) => ({
  name: 'Ana Pérez',
  email: `ana${Date.now()}${counter++}@example.com`,
  phone: '+54 11 5555-1234',
  ...overrides,
});

const shipmentPayload = (senderId, overrides = {}) => ({
  sender: senderId,
  recipient: { name: 'Luis Gómez', address: 'Av. Siempre Viva 742', city: 'Rosario', phone: '+54 341 444-0000' },
  description: 'Caja con libros',
  weightKg: 2.5,
  ...overrides,
});

async function createUser(overrides) {
  const res = await api().post('/api/users').send(userPayload(overrides)).expect(201);
  return res.body.data;
}

async function createShipment(overrides = {}) {
  const user = await createUser();
  const res = await api().post('/api/shipments').send(shipmentPayload(user.id, overrides)).expect(201);
  return res.body.data;
}

const changeStatus = (id, status, note) => api().patch(`/api/shipments/${id}/status`).send({ status, note });

const pdfBuffer = () => Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');
const pngBuffer = () => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

// Cuenta archivos dentro del directorio de uploads de test.
function countUploadedFiles() {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [e]));
  return fs.existsSync(env.UPLOAD_DIR) ? walk(env.UPLOAD_DIR).length : 0;
}

module.exports = {
  api, userPayload, shipmentPayload, createUser, createShipment, changeStatus,
  pdfBuffer, pngBuffer, countUploadedFiles,
};
