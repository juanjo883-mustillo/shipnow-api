const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const shipmentService = require('../services/shipment.service');

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(success(await shipmentService.createShipment(req.body)));
});
exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await shipmentService.getShipments(req.query);
  res.json(success(items, meta));
});
exports.getById = asyncHandler(async (req, res) => {
  res.json(success(await shipmentService.getShipmentById(req.params.id)));
});
exports.tracking = asyncHandler(async (req, res) => {
  res.json(success(await shipmentService.getTracking(req.params.trackingCode)));
});
exports.update = asyncHandler(async (req, res) => {
  res.json(success(await shipmentService.updateShipment(req.params.id, req.body)));
});
exports.changeStatus = asyncHandler(async (req, res) => {
  res.json(success(await shipmentService.changeStatus(req.params.id, req.body)));
});
exports.remove = asyncHandler(async (req, res) => {
  await shipmentService.deleteShipment(req.params.id);
  res.status(204).send();
});
exports.uploadReceipt = asyncHandler(async (req, res) => {
  res.status(201).json(success(await shipmentService.addReceipt(req.params.id, req.file)));
});
