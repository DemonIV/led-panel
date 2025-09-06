// backend/routes/renderQueueRoutes.js
const express = require('express');
const router = express.Router();
const RenderQueueController = require('../controllers/renderQueueController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ✅ Render Queue Management
router.get('/', authenticateToken, RenderQueueController.getAllJobs);
router.post('/', authenticateToken, authorizeRoles('admin', 'ajans'), RenderQueueController.createRenderJob);
router.put('/:id/status', authenticateToken, authorizeRoles('admin', 'ajans'), RenderQueueController.updateJobStatus);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'ajans'), RenderQueueController.deleteJob);

// ✅ After Effects specific endpoints
router.post('/ae-composition', authenticateToken, authorizeRoles('admin', 'ajans'), RenderQueueController.createAEComposition);
router.get('/pending', authenticateToken, RenderQueueController.getPendingJobs);
router.post('/batch', authenticateToken, authorizeRoles('admin', 'ajans'), RenderQueueController.createBatchJobs);

// ✅ Job monitoring
router.get('/status/:id', authenticateToken, RenderQueueController.getJobStatus);
router.get('/stats', authenticateToken, RenderQueueController.getRenderStats);

module.exports = router;