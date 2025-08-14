const express = require('express');
const router = express.Router();
const { getAllLeds, createLed, updateLed, deleteLed } = require('../controllers/ledController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Tüm kullanıcılar LED'leri görüntüleyebilir
router.get('/', authenticateToken, getAllLeds);

// Sadece admin ve ajans LED oluşturabilir
router.post('/', authenticateToken, authorizeRoles('admin', 'ajans'), createLed);

// Sadece admin ve ajans LED güncelleyebilir
router.put('/:id', authenticateToken, authorizeRoles('admin', 'ajans'), updateLed);

// Sadece admin LED silebilir
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteLed);

module.exports = router;