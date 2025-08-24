const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getAllLeds, createLed, updateLed, deleteLed, importCSV } = require('../controllers/ledController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Multer configuration
const upload = multer({ dest: 'uploads/' });

// Existing routes
router.get('/', authenticateToken, getAllLeds);
router.post('/', authenticateToken, authorizeRoles('admin', 'ajans'), createLed);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'ajans'), updateLed);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteLed);

// NEW: CSV import route
router.post('/import-csv', authenticateToken, authorizeRoles('admin', 'ajans'), upload.single('csvFile'), importCSV);

module.exports = router;