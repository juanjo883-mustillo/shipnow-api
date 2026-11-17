// Se ejecuta antes que cualquier test: fija el entorno y una carpeta temporal de uploads
// para que el directorio uploads/ del repo no se ensucie nunca.
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'shipnow-uploads-'));

const mongoose = require('mongoose');
const env = require('../src/config/env');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
require('../src/models/user.model');
require('../src/models/shipment.model');

exports.mochaHooks = {
  async beforeAll() {
    // Salvaguarda: jamás tocar una base que no sea de prueba.
    const dbName = new URL(env.MONGO_URI).pathname.replace('/', '');
    if (!/test/i.test(dbName)) {
      throw new Error(`MONGO_URI_TEST debe apuntar a una base de prueba (el nombre debe incluir "test"). Recibido: "${dbName}"`);
    }
    try {
      await connectDatabase();
    } catch (err) {
      throw new Error(`No se pudo conectar a MongoDB de test (${env.MONGO_URI}). ` +
        `Levantá una instancia, por ejemplo: docker run -d -p 27017:27017 mongo:7. Detalle: ${err.message}`);
    }
    await mongoose.connection.dropDatabase();
    await Promise.all(Object.values(mongoose.models).map((m) => m.createIndexes()));
  },
  async beforeEach() {
    await Promise.all(Object.values(mongoose.models).map((m) => m.deleteMany({})));
  },
  async afterAll() {
    await mongoose.connection.dropDatabase();
    await disconnectDatabase();
    fs.rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true });
  },
};
