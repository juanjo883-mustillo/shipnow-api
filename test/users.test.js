const { expect } = require('chai');
const { api, userPayload, createUser, createShipment } = require('./helpers');

const MISSING_ID = '665f1c2e8b3a4c0012a1b2c3';

describe('Usuarios', () => {
  describe('POST /api/users', () => {
    it('crea un usuario (201) y devuelve id sin _id/__v', async () => {
      const res = await api().post('/api/users').send(userPayload({ email: 'ANA@Example.com' })).expect(201);
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.include({ name: 'Ana Pérez', email: 'ana@example.com', role: 'customer' });
      expect(res.body.data.id).to.be.a('string');
      expect(res.body.data).to.not.have.any.keys('_id', '__v');
    });

    it('rechaza datos inválidos (400) con detalle por campo', async () => {
      const res = await api().post('/api/users').send({ name: 'A', email: 'no-es-email' }).expect(400);
      expect(res.body.error.code).to.equal('INVALID_DATA');
      expect(res.body.error.details).to.have.property('email');
    });

    it('rechaza un rol inexistente (400)', async () => {
      await api().post('/api/users').send(userPayload({ role: 'superadmin' })).expect(400);
    });

    it('rechaza un email duplicado (409 CONFLICT)', async () => {
      const user = await createUser();
      const res = await api().post('/api/users').send(userPayload({ email: user.email })).expect(409);
      expect(res.body.error.code).to.equal('CONFLICT');
    });

    it('ignora campos no permitidos (documents)', async () => {
      const res = await api().post('/api/users').send(userPayload({ documents: [{ filename: 'x' }] })).expect(201);
      expect(res.body.data.documents).to.deep.equal([]);
    });
  });

  describe('GET /api/users', () => {
    it('lista con paginación', async () => {
      for (let i = 0; i < 3; i += 1) await createUser();
      const res = await api().get('/api/users?page=1&limit=2').expect(200);
      expect(res.body.data).to.have.length(2);
      expect(res.body.meta).to.deep.equal({ page: 1, limit: 2, total: 3, totalPages: 2 });
    });

    it('limita el tamaño de página al máximo permitido', async () => {
      const res = await api().get('/api/users?limit=9999').expect(200);
      expect(res.body.meta.limit).to.equal(50);
    });

    it('rechaza parámetros de paginación inválidos (400)', async () => {
      await api().get('/api/users?page=0').expect(400);
      await api().get('/api/users?limit=abc').expect(400);
    });
  });

  describe('GET /api/users/:id', () => {
    it('devuelve el usuario', async () => {
      const user = await createUser();
      const res = await api().get(`/api/users/${user.id}`).expect(200);
      expect(res.body.data.email).to.equal(user.email);
    });
    it('404 si no existe', async () => {
      const res = await api().get(`/api/users/${MISSING_ID}`).expect(404);
      expect(res.body.error.code).to.equal('NOT_FOUND');
    });
    it('400 si el id es inválido', async () => {
      await api().get('/api/users/abc').expect(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('actualiza campos permitidos', async () => {
      const user = await createUser();
      const res = await api().put(`/api/users/${user.id}`).send({ name: 'Ana María', role: 'courier' }).expect(200);
      expect(res.body.data).to.include({ name: 'Ana María', role: 'courier' });
    });
    it('400 si no hay campos para actualizar', async () => {
      const user = await createUser();
      await api().put(`/api/users/${user.id}`).send({ foo: 'bar' }).expect(400);
    });
    it('400 si el dato es inválido', async () => {
      const user = await createUser();
      await api().put(`/api/users/${user.id}`).send({ email: 'malo' }).expect(400);
    });
    it('404 si no existe', async () => {
      await api().put(`/api/users/${MISSING_ID}`).send({ name: 'Ana' }).expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('elimina un usuario sin envíos (204)', async () => {
      const user = await createUser();
      await api().delete(`/api/users/${user.id}`).expect(204);
      await api().get(`/api/users/${user.id}`).expect(404);
    });
    it('409 INVALID_STATE si tiene envíos asociados', async () => {
      const shipment = await createShipment();
      const res = await api().delete(`/api/users/${shipment.sender}`).expect(409);
      expect(res.body.error.code).to.equal('INVALID_STATE');
    });
    it('404 si no existe', async () => {
      await api().delete(`/api/users/${MISSING_ID}`).expect(404);
    });
  });
});
