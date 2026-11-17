const router = require('express').Router();
const internalOnly = require('../middlewares/internalOnly');

router.use('/health', require('./health.routes'));
router.use('/users', require('./user.routes'));
router.use('/shipments', require('./shipment.routes'));
router.use('/mocks', internalOnly, require('./mock.routes'));
router.use('/logger', internalOnly, require('./logger.routes'));

module.exports = router;
