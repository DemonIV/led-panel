// backend/controllers/assetController.js
const AssetModel = require('../models/assetModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploads klasörünü oluştur
const uploadsDir = 'uploads/assets/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
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
    const allowedTypes = /\.(jpg|jpeg|png|gif|psd|ai|aep|mp4|mov|c4d|obj|fbx)$/i;
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
    
    // Asset bilgisini al
    const asset = await AssetModel.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset bulunamadı' });
    }

    // Dosyayı sil
    if (asset.filePath && fs.existsSync(asset.filePath)) {
      fs.unlinkSync(asset.filePath);
    }

    // Veritabanından sil
    const result = await AssetModel.delete(id);
    res.json({ message: 'Asset silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { upload, uploadAsset, getAssetsByProject, deleteAsset };