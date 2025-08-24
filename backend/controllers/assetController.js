const AssetModel = require('../models/assetModel');
const multer = require('multer');
const path = require('path');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assets/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(jpg|jpeg|png|gif|psd|ai|aep|mp4|mov)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü'));
    }
  }
});

const uploadAsset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya gerekli' });
    }

    const assetData = {
      assetName: req.body.assetName || req.file.originalname,
      assetType: req.body.assetType,
      filePath: req.file.path,
      fileSize: req.file.size,
      projectID: req.body.projectID
    };

    const result = await AssetModel.create(assetData);
    res.status(201).json({
      assetID: result.insertId,
      message: 'Asset yüklendi',
      filePath: req.file.path
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAssetsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const assets = await AssetModel.getByProject(projectId);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AssetModel.delete(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Asset bulunamadı' });
    }
    res.json({ message: 'Asset silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { upload, uploadAsset, getAssetsByProject, deleteAsset };