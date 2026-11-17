const { expect } = require('chai');
const { api } = require('./helpers');

describe('Swagger', () => {
  it('GET /api/docs/ sirve la interfaz de Swagger UI', async () => {
    const res = await api().get('/api/docs/').expect(200);
    expect(res.headers['content-type']).to.match(/text\/html/);
    expect(res.text).to.include('swagger-ui');
  });

  describe('especificación /api/docs.json', () => {
    let spec;
    before(async () => { spec = (await api().get('/api/docs.json').expect(200)).body; });

    it('documenta los endpoints principales', () => {
      const expected = [
        '/api/users', '/api/users/{id}', '/api/users/{id}/documents',
        '/api/shipments', '/api/shipments/{id}', '/api/shipments/{id}/status',
        '/api/shipments/{id}/receipts', '/api/shipments/tracking/{trackingCode}',
        '/api/mocks/users', '/api/mocks/shipments', '/api/mocks/generate',
        '/api/logger/test', '/api/health',
      ];
      expected.forEach((p) => expect(spec.paths, p).to.have.property(p));
    });

    it('incluye los schemas de Usuario, Envío, Error y respuesta exitosa', () => {
      ['User', 'Shipment', 'Error', 'SuccessResponse'].forEach((s) => expect(spec.components.schemas).to.have.property(s));
    });

    it('define respuestas de error reutilizables', () => {
      ['BadRequest', 'NotFound', 'Conflict', 'PayloadTooLarge', 'UnsupportedMediaType']
        .forEach((r) => expect(spec.components.responses).to.have.property(r));
    });

    it('cada ruta documentada existe realmente (no devuelve 404 de ruta)', async () => {
      const id = '665f1c2e8b3a4c0012a1b2c3';
      for (const [docPath, methods] of Object.entries(spec.paths)) {
        const url = docPath.replace('{id}', id).replace('{trackingCode}', 'SN-NOEXISTE');
        for (const method of Object.keys(methods)) {
          const res = await api()[method](`${url}${url.includes('/mocks/') ? '?quantity=1' : ''}`).send({});
          const routeMissing = res.status === 404 && res.body.error && /Ruta no encontrada/.test(res.body.error.message);
          expect(routeMissing, `${method.toUpperCase()} ${docPath}`).to.equal(false);
        }
      }
    });
  });
});
