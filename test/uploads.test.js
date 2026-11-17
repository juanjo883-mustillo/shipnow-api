const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const env = require('../src/config/env');
const User = require('../src/models/user.model');
const Shipment = require('../src/models/shipment.model');
const { api, createUser, createShipment, pdfBuffer, pngBuffer, countUploadedFiles } = require('./helpers');

const MISSING_ID = '665f1c2e8b3a4c0012a1b2c3';
const pdf = { filename: 'dni.pdf', contentType: 'application/pdf' };

describe('Carga de archivos (Multer)', () => {
  beforeEach(() => {
    fs.rmSync(env.UPLOAD_DIR, { recursive: true, force: true });
    fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
  });

  describe('POST /api/users/:id/documents', () => {
    it('guarda el archivo en disco y sus metadatos en la base', async () => {
      const user = await createUser();
      const res = await api().post(`/api/users/${user.id}/documents`).attach('document', pdfBuffer(), pdf).expect(201);
      const meta = res.body.data;
      expect(meta).to.include({ originalName: 'dni.pdf', mimeType: 'application/pdf' });
      expect(meta.size).to.equal(pdfBuffer().length);
      expect(meta.path).to.match(/^documents\/[0-9a-f-]{36}\.pdf$/);
      expect(fs.existsSync(path.join(env.UPLOAD_DIR, meta.path))).to.equal(true);

      const stored = await User.findById(user.id);
      expect(stored.documents).to.have.length(1);
      expect(stored.documents[0].filename).to.equal(meta.filename);
    });

    it('acepta imágenes PNG', async () => {
      const user = await createUser();
      await api().post(`/api/users/${user.id}/documents`)
        .attach('document', pngBuffer(), { filename: 'foto.png', contentType: 'image/png' }).expect(201);
    });

    it('400 FILE_REQUIRED si no se envía archivo', async () => {
      const user = await createUser();
      const res = await api().post(`/api/users/${user.id}/documents`).expect(400);
      expect(res.body.error.code).to.equal('FILE_REQUIRED');
    });

    it('415 INVALID_FILE_TYPE si el tipo no está permitido', async () => {
      const user = await createUser();
      const res = await api().post(`/api/users/${user.id}/documents`)
        .attach('document', Buffer.from('hola'), { filename: 'nota.txt', contentType: 'text/plain' }).expect(415);
      expect(res.body.error.code).to.equal('INVALID_FILE_TYPE');
      expect(countUploadedFiles()).to.equal(0);
    });

    it('415 si el contenido no coincide con el tipo declarado (y no deja archivos)', async () => {
      const user = await createUser();
      const res = await api().post(`/api/users/${user.id}/documents`)
        .attach('document', Buffer.from('esto no es un pdf'), pdf).expect(415);
      expect(res.body.error.code).to.equal('INVALID_FILE_TYPE');
      expect(countUploadedFiles()).to.equal(0);
    });

    it('413 FILE_TOO_LARGE si supera el límite (y no deja archivos)', async () => {
      const original = env.MAX_FILE_SIZE_MB;
      env.MAX_FILE_SIZE_MB = 0.001; // ~1 KB
      try {
        const user = await createUser();
        const big = Buffer.concat([pdfBuffer(), Buffer.alloc(8 * 1024)]);
        const res = await api().post(`/api/users/${user.id}/documents`).attach('document', big, pdf).expect(413);
        expect(res.body.error.code).to.equal('FILE_TOO_LARGE');
        expect(countUploadedFiles()).to.equal(0);
      } finally {
        env.MAX_FILE_SIZE_MB = original;
      }
    });

    it('400 si el campo del formulario no es "document"', async () => {
      const user = await createUser();
      const res = await api().post(`/api/users/${user.id}/documents`).attach('otro', pdfBuffer(), pdf).expect(400);
      expect(res.body.error.code).to.equal('INVALID_DATA');
      expect(countUploadedFiles()).to.equal(0);
    });

    it('404 si el usuario no existe y elimina el archivo subido', async () => {
      const res = await api().post(`/api/users/${MISSING_ID}/documents`).attach('document', pdfBuffer(), pdf).expect(404);
      expect(res.body.error.code).to.equal('NOT_FOUND');
      expect(countUploadedFiles()).to.equal(0);
    });

    it('al eliminar el usuario se borran sus archivos', async () => {
      const user = await createUser();
      await api().post(`/api/users/${user.id}/documents`).attach('document', pdfBuffer(), pdf).expect(201);
      expect(countUploadedFiles()).to.equal(1);
      await api().delete(`/api/users/${user.id}`).expect(204);
      expect(countUploadedFiles()).to.equal(0);
    });
  });

  describe('POST /api/shipments/:id/receipts', () => {
    it('guarda el comprobante y sus metadatos', async () => {
      const shipment = await createShipment();
      const res = await api().post(`/api/shipments/${shipment.id}/receipts`)
        .attach('receipt', pdfBuffer(), { filename: 'comprobante.pdf', contentType: 'application/pdf' }).expect(201);
      expect(res.body.data.path).to.match(/^receipts\//);
      const stored = await Shipment.findById(shipment.id);
      expect(stored.receipts).to.have.length(1);
      expect(fs.existsSync(path.join(env.UPLOAD_DIR, res.body.data.path))).to.equal(true);
    });

    it('400 FILE_REQUIRED, 415 y 404 se manejan correctamente', async () => {
      const shipment = await createShipment();
      const noFile = await api().post(`/api/shipments/${shipment.id}/receipts`).expect(400);
      expect(noFile.body.error.code).to.equal('FILE_REQUIRED');

      await api().post(`/api/shipments/${shipment.id}/receipts`)
        .attach('receipt', Buffer.from('x'), { filename: 'a.exe', contentType: 'application/octet-stream' }).expect(415);

      await api().post(`/api/shipments/${MISSING_ID}/receipts`).attach('receipt', pdfBuffer(), pdf).expect(404);
      expect(countUploadedFiles()).to.equal(0);
    });

    it('al eliminar el envío se borran sus comprobantes', async () => {
      const shipment = await createShipment();
      await api().post(`/api/shipments/${shipment.id}/receipts`).attach('receipt', pdfBuffer(), pdf).expect(201);
      await api().delete(`/api/shipments/${shipment.id}`).expect(204);
      expect(countUploadedFiles()).to.equal(0);
    });
  });
});
