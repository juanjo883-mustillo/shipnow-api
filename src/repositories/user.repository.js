// Único lugar (junto a los models) donde se accede a MongoDB para usuarios.
const User = require('../models/user.model');

const OPTS = { returnDocument: 'after', runValidators: true };

module.exports = {
  create: (data) => User.create(data),
  insertMany: (items) => User.insertMany(items),
  findById: (id) => User.findById(id),
  async findPaginated({ page, limit }) {
    const [items, total] = await Promise.all([
      User.find().select('-documents').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(),
    ]);
    return { items, total };
  },
  updateById: (id, update) => User.findByIdAndUpdate(id, update, OPTS),
  deleteById: (id) => User.findByIdAndDelete(id),
  addDocument: (id, document) => User.findByIdAndUpdate(id, { $push: { documents: document } }, OPTS),
};
