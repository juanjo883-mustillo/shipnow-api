const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');
const { ALLOWED_MIME_TYPES } = require('../constants');
const { InvalidFileTypeError } = require('../errors');

function buildUploader(kind) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.resolve(env.UPLOAD_DIR, kind);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    // Nombre generado por el servidor: nunca se usa el nombre original en disco.
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED_MIME_TYPES[file.mimetype]}`),
  });

  return multer({
    storage,
    limits: { fileSize: Math.floor(env.MAX_FILE_SIZE_MB * 1024 * 1024), files: 1 }, // Multer exige un entero
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME_TYPES[file.mimetype]) {
        return cb(new InvalidFileTypeError(
          `Tipo de archivo no permitido. Permitidos: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`
        ));
      }
      return cb(null, true);
    },
  });
}

// Se crea por request para respetar MAX_FILE_SIZE_MB vigente.
const uploadSingle = (field, kind) => (req, res, next) => buildUploader(kind).single(field)(req, res, next);

module.exports = { uploadSingle };
