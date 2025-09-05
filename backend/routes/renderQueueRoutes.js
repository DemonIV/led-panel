const express = require('express');
const router = express.Router();
const RenderQueueController = require('../controllers/renderQueueController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Render kuyruğunu görüntüle (herkese açık)
router.get('/', authenticateToken, RenderQueueController.getRenderQueue);

// Render istatistikleri (herkese açık)
router.get('/stats', authenticateToken, RenderQueueController.getRenderStats);

// After Effects için - bir sonraki işi al (admin/ajans)
router.get('/next', authenticateToken, authorizeRoles('admin', 'ajans'), RenderQueueController.getNextJob);

// Render kuyruğuna iş ekle (admin/ajans)
router.post('/', authenticateToken, authorizeRoles('admin', 'ajans'), RenderQueueController.addToQueue);

// Render durumunu güncelle (admin/ajans)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'ajans'), RenderQueueController.updateRenderStatus);

// Render işini sil (admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), RenderQueueController.deleteFromQueue);

module.exports = router;