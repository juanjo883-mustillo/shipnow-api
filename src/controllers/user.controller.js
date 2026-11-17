const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const userService = require('../services/user.service');

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(success(await userService.createUser(req.body)));
});
exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await userService.getUsers(req.query);
  res.json(success(items, meta));
});
exports.getById = asyncHandler(async (req, res) => {
  res.json(success(await userService.getUserById(req.params.id)));
});
exports.update = asyncHandler(async (req, res) => {
  res.json(success(await userService.updateUser(req.params.id, req.body)));
});
exports.remove = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
});
exports.uploadDocument = asyncHandler(async (req, res) => {
  res.status(201).json(success(await userService.addDocument(req.params.id, req.file)));
});
