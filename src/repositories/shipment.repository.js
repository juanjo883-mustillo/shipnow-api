// Único lugar (junto a los models) donde se accede a MongoDB para envíos.
const Shipment = require('../models/shipment.model');

const OPTS = { returnDocument: 'after', runValidators: true };

module.exports = {
  create: (data) => Shipment.create(data),
  insertMany: (items) => Shipment.insertMany(items),
  findById: (id) => Shipment.findById(id),
  findByIdWithSender: (id) => Shipment.findById(id).populate('sender', 'name email'),
  findByTrackingCode: (trackingCode) => Shipment.findOne({ trackingCode }),
  async findPaginated({ filter = {}, page, limit }) {
    const [items, total] = await Promise.all([
      Shipment.find(filter).select('-history -receipts').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
      Shipment.countDocuments(filter),
    ]);
    return { items, total };
  },
  countBySender: (senderId) => Shipment.countDocuments({ sender: senderId }),
  updateById: (id, update) => Shipment.findByIdAndUpdate(id, update, OPTS),
  deleteById: (id) => Shipment.findByIdAndDelete(id),
  addReceipt: (id, receipt) => Shipment.findByIdAndUpdate(id, { $push: { receipts: receipt } }, OPTS),
};
