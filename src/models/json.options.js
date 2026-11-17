// Serialización uniforme: expone `id`, oculta `_id` y `__v`.
module.exports = {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    return ret;
  },
};
