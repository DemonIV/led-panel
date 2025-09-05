const express = require('express');
const router = express.Router();
const ScraperController = require('../controllers/scraperController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Tek URL scraping
router.post('/scrape', authenticateToken, authorizeRoles('admin', 'ajans'), ScraperController.scrapeProduct);

// Toplu URL scraping
router.post('/scrape-bulk', authenticateToken, authorizeRoles('admin', 'ajans'), ScraperController.scrapeBulkURLs);

// ✅ YENİ: Görsel indirme
router.post('/download-images', authenticateToken, authorizeRoles('admin', 'ajans'), ScraperController.downloadAndSaveImages);

// ✅ YENİ: Tam proje oluşturma
router.post('/scrape-and-create-project', authenticateToken, authorizeRoles('admin', 'ajans'), ScraperController.scrapeAndCreateProject);

// ✅ YENİ: Görsel optimizasyonu
router.post('/optimize-images/:projectId', authenticateToken, authorizeRoles('admin', 'ajans'), ScraperController.optimizeScrapedImages);

// Hazır seçici şablonları
router.get('/presets', authenticateToken, ScraperController.getPresetSelectors);

// Scraping istatistikleri
router.get('/stats', authenticateToken, ScraperController.getScrapingStats);
