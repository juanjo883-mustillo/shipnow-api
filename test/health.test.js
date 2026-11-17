const { expect } = require('chai');
const { api } = require('./helpers');

describe('Health check', () => {
  it('GET /api/health responde 200 con la base conectada', async () => {
    const res = await api().get('/api/health').expect(200);
    expect(res.body).to.include({ status: 'ok', database: 'connected', environment: 'test' });
    expect(res.body.uptime).to.be.a('number');
    expect(res.body.timestamp).to.be.a('string');
  });
});

describe('Manejo global de errores', () => {
  it('una ruta inexistente devuelve 404 con estructura estándar', async () => {
    const res = await api().get('/api/no-existe').expect(404);
    expect(res.body.status).to.equal('error');
    expect(res.body.error).to.have.keys('code', 'message');
    expect(res.body.error.code).to.equal('NOT_FOUND');
  });

  it('un JSON mal formado devuelve 400 INVALID_DATA', async () => {
    const res = await api().post('/api/users').set('Content-Type', 'application/json').send('{roto').expect(400);
    expect(res.body.error.code).to.equal('INVALID_DATA');
  });

  it('un body demasiado grande devuelve 413', async () => {
    const res = await api().post('/api/users').send({ name: 'x'.repeat(200 * 1024) }).expect(413);
    expect(res.body.error.code).to.equal('PAYLOAD_TOO_LARGE');
  });
});
