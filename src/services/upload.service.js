const fs = require('fs/promises');
const path = require('path');
const env = require('../config/env');
const logger = require('../utils/logger');
const { FileRequiredError, InvalidFileTypeError } = require('../errors');

// Firmas ("magic numbers") para no confiar solo en el mimetype declarado por el cliente.
const SIGNATURES = {
  'application/pdf': [Buffer.from('%PDF')],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
};

async function readHeader(filePath) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(8);
    await handle.read(buffer, 0, 8, 0);
    return buffer;
  } finally {
    await handle.close();
  }
}

// Borra un archivo ya guardado en disco (best-effort).
async function discardUploaded(file) {
  if (!file || !file.path) return;
  try {
    await fs.unlink(file.path);
  } catch (err) {
    if (err.code !== 'ENOENT') logger.warn('No se pudo borrar archivo subido', { path: file.path, message: err.message });
  }
}

async function removeStored(files = []) {
  for (const file of files) {
    await discardUploaded({ path: path.join(env.UPLOAD_DIR, file.path) });
  }
}

// Valida el archivo subido y devuelve los metadatos a guardar en la base.
async function buildMetadata(file, kind) {
  if (!file) throw new FileRequiredError();
  const header = await readHeader(file.path);
  const signatures = SIGNATURES[file.mimetype] || [];
  const valid = signatures.some((sig) => header.subarray(0, sig.length).equals(sig));
  if (!valid) {
    await discardUploaded(file);
    throw new InvalidFileTypeError('El contenido del archivo no coincide con su tipo declarado');
  }
  return {
    originalName: path.basename(file.originalname).slice(0, 255),
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    path: `${kind}/${file.filename}`,
  };
}

module.exports = { buildMetadata, discardUploaded, removeStored };
