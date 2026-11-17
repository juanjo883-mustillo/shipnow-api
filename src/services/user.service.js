const userRepository = require('../repositories/user.repository');
const shipmentRepository = require('../repositories/shipment.repository');
const uploadService = require('./upload.service');
const logger = require('../utils/logger');
const pick = require('../utils/pick');
const { assertObjectId, parsePagination, buildMeta } = require('../utils/validators');
const { NotFoundError, InvalidStateError, ValidationError, FileRequiredError } = require('../errors');
const { UPLOAD_KINDS } = require('../constants');

const WRITABLE_FIELDS = ['name', 'email', 'phone', 'role'];

async function createUser(data) {
  const user = await userRepository.create(pick(data, WRITABLE_FIELDS));
  logger.info('Usuario creado', { userId: user.id });
  return user;
}

async function getUsers(query) {
  const { page, limit } = parsePagination(query);
  const { items, total } = await userRepository.findPaginated({ page, limit });
  return { items, meta: buildMeta(page, limit, total) };
}

async function getUserById(id) {
  assertObjectId(id);
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError('Usuario no encontrado');
  return user;
}

async function updateUser(id, data) {
  assertObjectId(id);
  const fields = pick(data, WRITABLE_FIELDS);
  if (Object.keys(fields).length === 0) {
    throw new ValidationError('No se enviaron campos para actualizar');
  }
  const user = await userRepository.updateById(id, { $set: fields });
  if (!user) throw new NotFoundError('Usuario no encontrado');
  logger.info('Usuario actualizado', { userId: id });
  return user;
}

async function deleteUser(id) {
  const user = await getUserById(id);
  const shipments = await shipmentRepository.countBySender(id);
  if (shipments > 0) {
    throw new InvalidStateError('No se puede eliminar un usuario que tiene envíos asociados');
  }
  await userRepository.deleteById(id);
  await uploadService.removeStored(user.documents);
  logger.info('Usuario eliminado', { userId: id });
}

async function addDocument(id, file) {
  if (!file) throw new FileRequiredError('Se requiere un archivo en el campo "document"');
  try {
    await getUserById(id);
    const metadata = await uploadService.buildMetadata(file, UPLOAD_KINDS.DOCUMENT);
    const updated = await userRepository.addDocument(id, metadata);
    if (!updated) throw new NotFoundError('Usuario no encontrado');
    logger.info('Documento de usuario cargado', { userId: id, filename: metadata.filename });
    return updated.documents[updated.documents.length - 1];
  } catch (err) {
    await uploadService.discardUploaded(file); // no dejar archivos huérfanos
    throw err;
  }
}

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser, addDocument };
