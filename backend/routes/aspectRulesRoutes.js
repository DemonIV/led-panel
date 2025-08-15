// backend/routes/aspectRulesRoutes.js (YENİ DOSYA)
const express = require('express');
const router = express.Router();
const AspectRulesController = require('../controllers/aspectRulesController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, AspectRulesController.getAllRules);
router.post('/', authenticateToken, authorizeRoles('admin', 'ajans'), AspectRulesController.createRule);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'ajans'), AspectRulesController.updateRule);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'ajans'), AspectRulesController.deleteRule);
router.post('/recalculate', authenticateToken, authorizeRoles('admin', 'ajans'), AspectRulesController.recalculateAllTypes);

module.exports = router;