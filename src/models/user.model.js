const mongoose = require('mongoose');
const { USER_ROLES } = require('../constants');
const fileSchema = require('./file.schema');
const jsonOptions = require('./json.options');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email no tiene un formato válido'],
    },
    phone: { type: String, trim: true, maxlength: 30 },
    role: { type: String, enum: USER_ROLES, default: 'customer' },
    documents: { type: [fileSchema], default: [] },
  },
  { timestamps: true, toJSON: jsonOptions }
);

module.exports = mongoose.model('User', userSchema);
