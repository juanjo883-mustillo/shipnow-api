const mongoose = require('mongoose');
const { SHIPMENT_STATUS } = require('../constants');
const fileSchema = require('./file.schema');
const jsonOptions = require('./json.options');

const STATUSES = Object.values(SHIPMENT_STATUS);

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    note: { type: String, trim: true, maxlength: 200 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    trackingCode: { type: String, required: true, unique: true, uppercase: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'El remitente es obligatorio'], index: true },
    recipient: {
      name: { type: String, required: [true, 'El nombre del destinatario es obligatorio'], trim: true, maxlength: 80 },
      address: { type: String, required: [true, 'La dirección del destinatario es obligatoria'], trim: true, maxlength: 150 },
      city: { type: String, required: [true, 'La ciudad del destinatario es obligatoria'], trim: true, maxlength: 80 },
      phone: { type: String, trim: true, maxlength: 30 },
    },
    description: { type: String, trim: true, maxlength: 200 },
    weightKg: {
      type: Number,
      required: [true, 'El peso es obligatorio'],
      min: [0.01, 'El peso mínimo es 0.01 kg'],
      max: [1000, 'El peso máximo es 1000 kg'],
    },
    status: { type: String, enum: STATUSES, default: SHIPMENT_STATUS.CREATED, index: true },
    history: { type: [historySchema], default: [] },
    receipts: { type: [fileSchema], default: [] },
    deliveredAt: { type: Date },
  },
  { timestamps: true, toJSON: jsonOptions }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
