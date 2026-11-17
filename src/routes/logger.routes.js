const router = require('express').Router();
const controller = require('../controllers/logger.controller');

/**
 * @openapi
 * /api/logger/test:
 *   get:
 *     tags: [Logger]
 *     summary: Emite un mensaje por cada nivel de log (error, warn, info, http, debug)
 *     security: [{ InternalApiKey: [] }]
 *     responses:
 *       200:
 *         description: Logs emitidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     levelsEmitted: { type: array, items: { type: string } }
 *                     activeLevel: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/test', controller.test);

module.exports = router;
