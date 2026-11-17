const { expect } = require('chai');
const env = require('../src/config/env');
const User = require('../src/models/user.model');
const Shipment = require('../src/models/shipment.model');
const { SHIPMENT_STATUS, USER_ROLES, STATUS_TRANSITIONS } = require('../src/constants');
const { api } = require('./helpers');

describe('Mocks', () => {
  it('GET /api/mocks/users genera la cantidad pedida con datos coherentes con el modelo', async () => {
    const res = await api().get('/api/mocks/users?quantity=5').expect(200);
    expect(res.body.data).to.have.length(5);
    res.body.data.forEach((u) => {
      expect(u.name).to.be.a('string');
      expect(u.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(USER_ROLES).to.include(u.role);
    });
    expect(new Set(res.body.data.map((u) => u.email)).size).to.equal(5);
  });

  it('GET /api/mocks/shipments genera envíos con historial coherente con el estado', async () => {
    const res = await api().get('/api/mocks/shipments?quantity=20').expect(200);
    expect(res.body.data).to.have.length(20);
    res.body.data.forEach((s) => {
      expect(s.trackingCode).to.match(/^SN-[0-9A-F]{10}$/);
      expect(Object.values(SHIPMENT_STATUS)).to.include(s.status);
      expect(s.history[s.history.length - 1].status).to.equal(s.status);
      s.history.slice(1).forEach((h, i) => {
        expect(STATUS_TRANSITIONS[s.history[i].status]).to.include(h.status);
      });
    });
  });

  ['0', '101', '-2', 'abc', '2.5', ''].forEach((q) => {
    it(`rechaza quantity="${q}" con 400 INVALID_MOCK_QUANTITY`, async () => {
      const res = await api().get(`/api/mocks/users?quantity=${q}`).expect(400);
      expect(res.body.error.code).to.equal('INVALID_MOCK_QUANTITY');
    });
  });

  it('rechaza la falta del parámetro quantity', async () => {
    const res = await api().get('/api/mocks/shipments').expect(400);
    expect(res.body.error.code).to.equal('INVALID_MOCK_QUANTITY');
  });

  it('POST /api/mocks/generate guarda usuarios y envíos en la base', async () => {
    const res = await api().post('/api/mocks/generate').send({ users: 3, shipments: 7 }).expect(201);
    expect(res.body.data).to.deep.equal({ users: 3, shipments: 7 });
    expect(await User.countDocuments()).to.equal(3);
    expect(await Shipment.countDocuments()).to.equal(7);
    const shipment = await Shipment.findOne();
    expect(await User.exists({ _id: shipment.sender })).to.not.equal(null);
  });

  it('POST /api/mocks/generate valida las cantidades', async () => {
    const res = await api().post('/api/mocks/generate').send({ users: 1000, shipments: 1 }).expect(400);
    expect(res.body.error.code).to.equal('INVALID_MOCK_QUANTITY');
    await api().post('/api/mocks/generate').expect(400);
  });

  describe('control de endpoints internos', () => {
    afterEach(() => { env.INTERNAL_API_KEY = ''; });

    it('exige x-internal-key cuando INTERNAL_API_KEY está definida', async () => {
      env.INTERNAL_API_KEY = 'secreta';
      const denied = await api().get('/api/mocks/users?quantity=1').expect(401);
      expect(denied.body.error.code).to.equal('UNAUTHORIZED');
      await api().get('/api/mocks/users?quantity=1').set('x-internal-key', 'incorrecta').expect(401);
      await api().get('/api/mocks/users?quantity=1').set('x-internal-key', 'secreta').expect(200);
    });
  });
});
