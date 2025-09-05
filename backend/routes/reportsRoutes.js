const express = require('express');
const router = express.Router();
const ReportsController = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/auth');

// Dashboard istatistikleri (herkese açık)
router.get('/dashboard', authenticateToken, ReportsController.getDashboardStats);

// Aylık rapor (herkese açık)
router.get('/monthly', authenticateToken, ReportsController.getMonthlyReport);

// CSV Export (herkese açık)
router.post('/export-csv', authenticateToken, ReportsController.exportToCSV);

// backend/routes/reportsRoutes.js - Yeni endpoint ekleyin

// Advanced LED filtering and export
module.exports = router;
