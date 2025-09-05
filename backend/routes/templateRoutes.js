const express = require('express');
const router = express.Router();
const TemplateController = require('../controllers/templateController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, TemplateController.getAllTemplates);
router.get('/stats', authenticateToken, TemplateController.getTemplateStats);
router.get('/type/:type', authenticateToken, TemplateController.getTemplatesByType);
router.post('/', authenticateToken, authorizeRoles('admin', 'ajans'), TemplateController.createTemplate);
router.post('/usage', authenticateToken, TemplateController.logTemplateUsage);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'ajans'), TemplateController.updateTemplate);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), TemplateController.deleteTemplate);

module.exports = router;     