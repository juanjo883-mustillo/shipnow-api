const router = require('express').Router();
const controller = require('../controllers/shipment.controller');
const { uploadSingle } = require('../middlewares/upload');
const { UPLOAD_KINDS } = require('../constants');

/**
 * @openapi
 * /api/shipments:
 *   post:
 *     tags: [Envíos]
 *     summary: Crear un envío (genera el código de seguimiento)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ShipmentInput' }
 *     responses:
 *       201: { $ref: '#/components/responses/ShipmentOk' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   get:
 *     tags: [Envíos]
 *     summary: Listar envíos (paginado, filtros opcionales)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - { name: status, in: query, schema: { type: string, enum: [created, in_transit, out_for_delivery, delivered, cancelled] } }
 *       - { name: sender, in: query, description: Id del remitente, schema: { type: string } }
 *     responses:
 *       200: { $ref: '#/components/responses/ShipmentList' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 * /api/shipments/tracking/{trackingCode}:
 *   get:
 *     tags: [Tracking]
 *     summary: Consultar el seguimiento público de un envío
 *     parameters:
 *       - { name: trackingCode, in: path, required: true, schema: { type: string, example: SN-A1B2C3D4E5 } }
 *     responses:
 *       200: { $ref: '#/components/responses/TrackingOk' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/shipments/{id}:
 *   get:
 *     tags: [Envíos]
 *     summary: Obtener el detalle de un envío
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200: { $ref: '#/components/responses/ShipmentOk' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Envíos]
 *     summary: Actualizar descripción, peso o destinatario (no permitido en estados finales)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string }
 *               weightKg: { type: number }
 *               recipient: { $ref: '#/components/schemas/Recipient' }
 *     responses:
 *       200: { $ref: '#/components/responses/ShipmentOk' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   delete:
 *     tags: [Envíos]
 *     summary: Eliminar un envío (solo en estado created o cancelled)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204: { description: Envío eliminado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 * /api/shipments/{id}/status:
 *   patch:
 *     tags: [Envíos]
 *     summary: Cambiar el estado de un envío (valida las transiciones permitidas)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/StatusUpdate' }
 *     responses:
 *       200: { $ref: '#/components/responses/ShipmentOk' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 * /api/shipments/{id}/receipts:
 *   post:
 *     tags: [Envíos]
 *     summary: Cargar un comprobante del envío (PDF, JPG o PNG)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [receipt]
 *             properties:
 *               receipt: { type: string, format: binary }
 *     responses:
 *       201: { $ref: '#/components/responses/FileOk' }
 *       400:
 *         description: Archivo requerido (FILE_REQUIRED) o identificador/campo inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       413: { $ref: '#/components/responses/PayloadTooLarge' }
 *       415: { $ref: '#/components/responses/UnsupportedMediaType' }
 */
router.post('/', controller.create);
router.get('/', controller.list);
router.get('/tracking/:trackingCode', controller.tracking); // antes de '/:id'
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.patch('/:id/status', controller.changeStatus);
router.delete('/:id', controller.remove);
router.post('/:id/receipts', uploadSingle('receipt', UPLOAD_KINDS.RECEIPT), controller.uploadReceipt);

module.exports = router;
