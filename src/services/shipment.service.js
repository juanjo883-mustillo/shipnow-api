const crypto = require('crypto');
const shipmentRepository = require('../repositories/shipment.repository');
const userRepository = require('../repositories/user.repository');
const uploadService = require('./upload.service');
const logger = require('../utils/logger');
const pick = require('../utils/pick');
const { assertObjectId, parsePagination, buildMeta } = require('../utils/validators');
const { NotFoundError, InvalidStateError, ValidationError, FileRequiredError } = require('../errors');
const {
  SHIPMENT_STATUS, STATUS_TRANSITIONS, TERMINAL_STATUSES, DELETABLE_STATUSES,
  UPLOAD_KINDS, TRACKING_PREFIX, RECIPIENT_FIELDS,
} = require('../constants');

const generateTrackingCode = () => `${TRACKING_PREFIX}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

async function createShipment(data) {
  const payload = pick(data, ['sender', 'recipient', 'description', 'weightKg']);
  assertObjectId(payload.sender, 'sender');
  const sender = await userRepository.findById(payload.sender);
  if (!sender) throw new NotFoundError('Remitente no encontrado');

  const shipment = await shipmentRepository.create({
    ...payload,
    recipient: pick(payload.recipient, RECIPIENT_FIELDS),
    trackingCode: generateTrackingCode(),
    status: SHIPMENT_STATUS.CREATED,
    history: [{ status: SHIPMENT_STATUS.CREATED, note: 'Envío creado' }],
  });
  logger.info('Envío creado', { shipmentId: shipment.id, trackingCode: shipment.trackingCode });
  return shipment;
}

async function getShipments(query) {
  const { page, limit } = parsePagination(query);
  const filter = {};
  if (query.status !== undefined) {
    if (!Object.values(SHIPMENT_STATUS).includes(query.status)) {
      throw new ValidationError(`Estado inválido. Valores permitidos: ${Object.values(SHIPMENT_STATUS).join(', ')}`);
    }
    filter.status = query.status;
  }
  if (query.sender !== undefined) {
    filter.sender = assertObjectId(query.sender, 'sender');
  }
  const { items, total } = await shipmentRepository.findPaginated({ filter, page, limit });
  return { items, meta: buildMeta(page, limit, total) };
}

async function findOrFail(id) {
  assertObjectId(id);
  const shipment = await shipmentRepository.findById(id);
  if (!shipment) throw new NotFoundError('Envío no encontrado');
  return shipment;
}

async function getShipmentById(id) {
  assertObjectId(id);
  const shipment = await shipmentRepository.findByIdWithSender(id);
  if (!shipment) throw new NotFoundError('Envío no encontrado');
  return shipment;
}

// Vista pública y reducida: no expone remitente, comprobantes ni datos personales.
async function getTracking(trackingCode) {
  const shipment = await shipmentRepository.findByTrackingCode(String(trackingCode).toUpperCase());
  if (!shipment) throw new NotFoundError('Código de seguimiento no encontrado');
  return {
    trackingCode: shipment.trackingCode,
    status: shipment.status,
    destinationCity: shipment.recipient.city,
    history: shipment.history,
    updatedAt: shipment.updatedAt,
  };
}

async function updateShipment(id, data) {
  const current = await findOrFail(id);
  if (TERMINAL_STATUSES.includes(current.status)) {
    throw new InvalidStateError(`No se puede modificar un envío en estado '${current.status}'`);
  }
  const $set = pick(data, ['description', 'weightKg']);
  const recipient = pick(data && data.recipient, RECIPIENT_FIELDS);
  for (const [key, value] of Object.entries(recipient)) $set[`recipient.${key}`] = value;
  if (Object.keys($set).length === 0) {
    throw new ValidationError('No se enviaron campos para actualizar');
  }
  const updated = await shipmentRepository.updateById(id, { $set });
  logger.info('Envío actualizado', { shipmentId: id });
  return updated;
}

async function changeStatus(id, data) {
  const { status, note } = pick(data, ['status', 'note']);
  if (!Object.values(SHIPMENT_STATUS).includes(status)) {
    throw new ValidationError(`Estado inválido. Valores permitidos: ${Object.values(SHIPMENT_STATUS).join(', ')}`);
  }
  const current = await findOrFail(id);
  if (!STATUS_TRANSITIONS[current.status].includes(status)) {
    throw new InvalidStateError(`No se puede pasar de '${current.status}' a '${status}'`);
  }
  const update = {
    $set: { status, ...(status === SHIPMENT_STATUS.DELIVERED ? { deliveredAt: new Date() } : {}) },
    $push: { history: { status, note: typeof note === 'string' ? note : undefined, at: new Date() } },
  };
  const updated = await shipmentRepository.updateById(id, update);
  logger.info('Estado de envío actualizado', { shipmentId: id, from: current.status, to: status });
  return updated;
}

async function deleteShipment(id) {
  const shipment = await findOrFail(id);
  if (!DELETABLE_STATUSES.includes(shipment.status)) {
    throw new InvalidStateError(`Solo se pueden eliminar envíos en estado: ${DELETABLE_STATUSES.join(', ')}`);
  }
  await shipmentRepository.deleteById(id);
  await uploadService.removeStored(shipment.receipts);
  logger.info('Envío eliminado', { shipmentId: id });
}

async function addReceipt(id, file) {
  if (!file) throw new FileRequiredError('Se requiere un archivo en el campo "receipt"');
  try {
    await findOrFail(id);
    const metadata = await uploadService.buildMetadata(file, UPLOAD_KINDS.RECEIPT);
    const updated = await shipmentRepository.addReceipt(id, metadata);
    if (!updated) throw new NotFoundError('Envío no encontrado');
    logger.info('Comprobante de envío cargado', { shipmentId: id, filename: metadata.filename });
    return updated.receipts[updated.receipts.length - 1];
  } catch (err) {
    await uploadService.discardUploaded(file);
    throw err;
  }
}

module.exports = {
  createShipment, getShipments, getShipmentById, getTracking,
  updateShipment, changeStatus, deleteShipment, addReceipt,
};
