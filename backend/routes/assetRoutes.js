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

// ===================================
// backend/models/assetModel.js - Eksik dosya
// ===================================

const db = require('../config/database');

class AssetModel {
  static async create(assetData) {
    const { assetName, assetType, filePath, fileSize, projectID } = assetData;
    const [result] = await db.execute(
      'INSERT INTO Assets (assetName, assetType, filePath, fileSize, projectID) VALUES (?, ?, ?, ?, ?)',
      [assetName, assetType, filePath, fileSize, projectID]
    );
    return result;
  }

  static async getByProject(projectId) {
    const [rows] = await db.execute(
      'SELECT * FROM Assets WHERE projectID = ? ORDER BY createdAt DESC',
      [projectId]
    );
    return rows;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM Assets WHERE assetID = ?', [id]);
    return result;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM Assets WHERE assetID = ?', [id]);
    return rows[0];
  }
}

module.exports = AssetModel;