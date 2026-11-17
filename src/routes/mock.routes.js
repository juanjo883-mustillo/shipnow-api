const router = require('express').Router();
const controller = require('../controllers/mock.controller');

/**
 * @openapi
 * /api/mocks/users:
 *   get:
 *     tags: [Mocks]
 *     summary: Genera usuarios simulados (sin guardarlos)
 *     security: [{ InternalApiKey: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/QuantityParam'
 *     responses:
 *       200: { $ref: '#/components/responses/MockUsersOk' }
 *       400:
 *         description: Cantidad inválida (INVALID_MOCK_QUANTITY)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 * /api/mocks/shipments:
 *   get:
 *     tags: [Mocks]
 *     summary: Genera envíos simulados con historial coherente (sin guardarlos)
 *     security: [{ InternalApiKey: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/QuantityParam'
 *     responses:
 *       200: { $ref: '#/components/responses/MockShipmentsOk' }
 *       400:
 *         description: Cantidad inválida (INVALID_MOCK_QUANTITY)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 * /api/mocks/generate:
 *   post:
 *     tags: [Mocks]
 *     summary: Genera y guarda usuarios y envíos simulados en la base
 *     security: [{ InternalApiKey: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [users, shipments]
 *             properties:
 *               users: { type: integer, minimum: 1, maximum: 100, example: 5 }
 *               shipments: { type: integer, minimum: 1, maximum: 100, example: 10 }
 *     responses:
 *       201: { $ref: '#/components/responses/MockGenerated' }
 *       400:
 *         description: Cantidad inválida (INVALID_MOCK_QUANTITY)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/users', controller.users);
router.get('/shipments', controller.shipments);
router.post('/generate', controller.generate);

module.exports = router;
