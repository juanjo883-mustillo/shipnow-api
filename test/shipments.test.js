const { expect } = require('chai');
const { api, shipmentPayload, createUser, createShipment, changeStatus } = require('./helpers');

const MISSING_ID = '665f1c2e8b3a4c0012a1b2c3';

describe('Envíos', () => {
  describe('POST /api/shipments', () => {
    it('crea un envío con trackingCode, estado created e historial inicial', async () => {
      const user = await createUser();
      const res = await api().post('/api/shipments').send(shipmentPayload(user.id)).expect(201);
      const s = res.body.data;
      expect(s.trackingCode).to.match(/^SN-[0-9A-F]{10}$/);
      expect(s.status).to.equal('created');
      expect(s.history).to.have.length(1);
      expect(s.history[0].status).to.equal('created');
      expect(s.sender).to.equal(user.id);
    });

    it('404 si el remitente no existe', async () => {
      const res = await api().post('/api/shipments').send(shipmentPayload(MISSING_ID)).expect(404);
      expect(res.body.error.code).to.equal('NOT_FOUND');
    });

    it('400 si el sender no es un id válido', async () => {
      await api().post('/api/shipments').send(shipmentPayload('xyz')).expect(400);
    });

    it('400 si faltan datos del destinatario o el peso es inválido', async () => {
      const user = await createUser();
      const res = await api().post('/api/shipments').send(shipmentPayload(user.id, { recipient: {}, weightKg: -3 })).expect(400);
      expect(res.body.error.code).to.equal('INVALID_DATA');
      expect(res.body.error.details).to.have.property('weightKg');
    });

    it('400 si el peso no es numérico', async () => {
      const user = await createUser();
      await api().post('/api/shipments').send(shipmentPayload(user.id, { weightKg: 'pesado' })).expect(400);
    });

    it('no permite fijar status ni trackingCode desde el cliente', async () => {
      const user = await createUser();
      const res = await api().post('/api/shipments')
        .send(shipmentPayload(user.id, { status: 'delivered', trackingCode: 'HACK' })).expect(201);
      expect(res.body.data.status).to.equal('created');
      expect(res.body.data.trackingCode).to.not.equal('HACK');
    });
  });

  describe('Flujo principal: creación y actualización', () => {
    it('created → in_transit → out_for_delivery → delivered con historial y tracking', async () => {
      const shipment = await createShipment();
      await changeStatus(shipment.id, 'in_transit', 'Salió del depósito').expect(200);
      await changeStatus(shipment.id, 'out_for_delivery').expect(200);
      const last = await changeStatus(shipment.id, 'delivered', 'Entregado en mano').expect(200);

      expect(last.body.data.status).to.equal('delivered');
      expect(last.body.data.deliveredAt).to.be.a('string');
      expect(last.body.data.history.map((h) => h.status)).to.deep.equal(
        ['created', 'in_transit', 'out_for_delivery', 'delivered']
      );

      const tracking = await api().get(`/api/shipments/tracking/${shipment.trackingCode}`).expect(200);
      expect(tracking.body.data.status).to.equal('delivered');
      expect(tracking.body.data.history).to.have.length(4);
    });

    it('actualiza descripción, peso y destinatario mientras no esté en estado final', async () => {
      const shipment = await createShipment();
      const res = await api().put(`/api/shipments/${shipment.id}`)
        .send({ description: 'Caja frágil', weightKg: 4, recipient: { city: 'Mendoza' } }).expect(200);
      expect(res.body.data).to.include({ description: 'Caja frágil', weightKg: 4 });
      expect(res.body.data.recipient).to.include({ city: 'Mendoza', name: 'Luis Gómez' });
    });
  });

  describe('PATCH /api/shipments/:id/status', () => {
    it('409 INVALID_STATE ante una transición no permitida', async () => {
      const shipment = await createShipment();
      const res = await changeStatus(shipment.id, 'delivered').expect(409);
      expect(res.body.error.code).to.equal('INVALID_STATE');
    });
    it('400 si el estado no existe', async () => {
      const shipment = await createShipment();
      await changeStatus(shipment.id, 'volando').expect(400);
    });
    it('404 si el envío no existe', async () => {
      await changeStatus(MISSING_ID, 'in_transit').expect(404);
    });
    it('un envío cancelado no puede cambiar de estado', async () => {
      const shipment = await createShipment();
      await changeStatus(shipment.id, 'cancelled').expect(200);
      await changeStatus(shipment.id, 'in_transit').expect(409);
    });
  });

  describe('PUT /api/shipments/:id', () => {
    it('409 si el envío está en estado final', async () => {
      const shipment = await createShipment();
      await changeStatus(shipment.id, 'cancelled').expect(200);
      await api().put(`/api/shipments/${shipment.id}`).send({ description: 'x' }).expect(409);
    });
    it('400 si no hay campos para actualizar', async () => {
      const shipment = await createShipment();
      await api().put(`/api/shipments/${shipment.id}`).send({}).expect(400);
    });
    it('404 si no existe', async () => {
      await api().put(`/api/shipments/${MISSING_ID}`).send({ description: 'x' }).expect(404);
    });
  });

  describe('GET /api/shipments', () => {
    it('lista paginado sin history ni receipts, y filtra por estado', async () => {
      const a = await createShipment();
      await createShipment();
      await changeStatus(a.id, 'in_transit').expect(200);

      const all = await api().get('/api/shipments?limit=10').expect(200);
      expect(all.body.data).to.have.length(2);
      expect(all.body.data[0]).to.not.have.any.keys('history', 'receipts');
      expect(all.body.meta.total).to.equal(2);

      const filtered = await api().get('/api/shipments?status=in_transit').expect(200);
      expect(filtered.body.data).to.have.length(1);
      expect(filtered.body.data[0].id).to.equal(a.id);
    });
    it('400 si el filtro de estado es inválido', async () => {
      await api().get('/api/shipments?status=otro').expect(400);
    });
  });

  describe('GET /api/shipments/:id', () => {
    it('devuelve el detalle con el remitente (name y email)', async () => {
      const shipment = await createShipment();
      const res = await api().get(`/api/shipments/${shipment.id}`).expect(200);
      expect(res.body.data.sender).to.have.keys('name', 'email', 'id');
      expect(res.body.data.history).to.have.length(1);
    });
    it('404 si no existe y 400 si el id es inválido', async () => {
      await api().get(`/api/shipments/${MISSING_ID}`).expect(404);
      await api().get('/api/shipments/123').expect(400);
    });
  });

  describe('GET /api/shipments/tracking/:trackingCode', () => {
    it('devuelve solo información pública (sin remitente ni comprobantes)', async () => {
      const shipment = await createShipment();
      const res = await api().get(`/api/shipments/tracking/${shipment.trackingCode.toLowerCase()}`).expect(200);
      expect(res.body.data).to.have.all.keys('trackingCode', 'status', 'destinationCity', 'history', 'updatedAt');
      expect(res.body.data.destinationCity).to.equal('Rosario');
    });
    it('404 si el código no existe', async () => {
      await api().get('/api/shipments/tracking/SN-NOEXISTE').expect(404);
    });
  });

  describe('DELETE /api/shipments/:id', () => {
    it('elimina un envío en estado created (204)', async () => {
      const shipment = await createShipment();
      await api().delete(`/api/shipments/${shipment.id}`).expect(204);
      await api().get(`/api/shipments/${shipment.id}`).expect(404);
    });
    it('409 si el envío está en tránsito', async () => {
      const shipment = await createShipment();
      await changeStatus(shipment.id, 'in_transit').expect(200);
      const res = await api().delete(`/api/shipments/${shipment.id}`).expect(409);
      expect(res.body.error.code).to.equal('INVALID_STATE');
    });
    it('404 si no existe', async () => {
      await api().delete(`/api/shipments/${MISSING_ID}`).expect(404);
    });
  });
});
