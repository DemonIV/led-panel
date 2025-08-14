const express = require('express');
const router = express.Router();
const { 
  getAllMagazalar, 
  createMagaza, 
  updateMagaza, 
  deleteMagaza, 
  getMagazaWithLeds 
} = require('../controllers/magazaController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Tüm kullanıcılar mağazaları görüntüleyebilir
router.get('/', authenticateToken, getAllMagazalar);

// Mağaza detayları ve LED'leri
router.get('/:id', authenticateToken, getMagazaWithLeds);

// Sadece admin ve ajans mağaza oluşturabilir
router.post('/', authenticateToken, authorizeRoles('admin', 'ajans'), createMagaza);

// Sadece admin ve ajans mağaza güncelleyebilir
router.put('/:id', authenticateToken, authorizeRoles('admin', 'ajans'), updateMagaza);

// Sadece admin mağaza silebilir
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteMagaza);

module.exports = router;