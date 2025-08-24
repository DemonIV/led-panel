const express = require('express');
const router = express.Router();
const { upload, uploadAsset, getAssetsByProject, deleteAsset } = require('../controllers/assetController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/upload', authenticateToken, authorizeRoles('admin', 'ajans'), upload.single('assetFile'), uploadAsset);
router.get('/project/:projectId', authenticateToken, getAssetsByProject);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteAsset);

module.exports = router;