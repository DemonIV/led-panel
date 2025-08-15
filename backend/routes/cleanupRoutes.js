// backend/routes/cleanupRoutes.js
const express = require('express');
const router = express.Router();
const CleanupController = require('../controllers/cleanupController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Cleanup istatistikleri (sadece admin ve ajans)
router.get('/stats', authenticateToken, authorizeRoles('admin', 'ajans'), CleanupController.getCleanupStats);

// Duplicate analizi (sadece admin ve ajans)
router.get('/analyze', authenticateToken, authorizeRoles('admin', 'ajans'), CleanupController.analyzeDuplicates);

// Duplicate temizlik (sadece admin ve ajans)
router.delete('/duplicates', authenticateToken, authorizeRoles('admin', 'ajans'), CleanupController.cleanupDuplicates);

module.exports = router;