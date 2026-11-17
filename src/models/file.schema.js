const { Schema } = require('mongoose');
const jsonOptions = require('./json.options');

// Metadatos de un archivo subido (documento de usuario o comprobante de envío).
module.exports = new Schema(
  {
    originalName: { type: String, required: true, maxlength: 255 },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    path: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { toJSON: jsonOptions }
);
