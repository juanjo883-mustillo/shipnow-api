const { expect } = require('chai');
const { api } = require('./helpers');

describe('Logger', () => {
  it('GET /api/logger/test emite un mensaje por nivel', async () => {
    const res = await api().get('/api/logger/test').expect(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.data.levelsEmitted).to.deep.equal(['error', 'warn', 'info', 'http', 'debug']);
  });
});
