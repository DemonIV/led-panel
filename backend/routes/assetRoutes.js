const express = require('express');
const router = express.Router();
const { upload, uploadAsset, getAssetsByProject, deleteAsset } = require('../controllers/assetController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Asset upload
router.post('/upload', authenticateToken, authorizeRoles('admin', 'ajans'), upload.single('assetFile'), uploadAsset);

// Get assets by project
router.get('/project/:projectId', authenticateToken, getAssetsByProject);

// Delete asset
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'ajans'), deleteAsset);

module.exports = router;

