const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const mockService = require('../services/mock.service');

exports.users = asyncHandler(async (req, res) => {
  res.json(success(mockService.generateUsers(req.query.quantity)));
});
exports.shipments = asyncHandler(async (req, res) => {
  res.json(success(mockService.generateShipments(req.query.quantity)));
});
exports.generate = asyncHandler(async (req, res) => {
  const result = await mockService.generateAndPersist(req.body || {});
  res.status(201).json(success(result));
});
