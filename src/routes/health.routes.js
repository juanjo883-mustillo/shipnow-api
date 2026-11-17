const router = require('express').Router();
const controller = require('../controllers/health.controller');

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Estado de la API y de la base de datos
 *     responses:
 *       200:
 *         description: API operativa
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Health' }
 *       503:
 *         description: Base de datos no disponible
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Health' }
 */
router.get('/', controller.check);

module.exports = router;
