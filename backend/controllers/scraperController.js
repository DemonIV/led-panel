// backend/controllers/scraperController.js
const mysql = require('mysql2/promise');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'led_panel_db'
});

class ScraperController {
  
  // ✅ EKSİK METOD: Tek URL scraping
  static async scrapeProduct(req, res) {
    try {
      const { url, selectors } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL gerekli' });
      }
      
      console.log(`🔍 Scraping URL: ${url}`);
      
      const productData = await ScraperController.scrapeProductInternal(url, selectors || {});
      
      res.json({
        success: true,
        data: productData
      });
      
    } catch (error) {
      console.error('❌ Scraping hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ EKSİK METOD: Preset selectors
  static async getPresetSelectors(req, res) {
    try {
      const presets = {
        default: {
          name: 'h1, .product-title, .title',
          width: '.width, .en, [data-width], .dimension-w',
          height: '.height, .boy, [data-height], .dimension-h',
          images: 'img, .product-image img, .gallery img',
          description: '.description, .product-description, p'
        },
        ecommerce: {
          name: '.product-name, .item-title, h1',
          width: '.spec-width, .dimension-width',
          height: '.spec-height, .dimension-height',
          images: '.product-gallery img, .main-image',
          description: '.product-desc, .description'
        },
        led_specific: {
          name: '.led-model, .model-name',
          width: '.pixel-width, .resolution-w, .en-px',
          height: '.pixel-height, .resolution-h, .boy-px',
          images: '.led-image, .product-photo',
          description: '.specifications, .tech-specs'
        }
      };
      
      res.json({ success: true, presets });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ EKSİK METOD: Scraping statistics
  static async getScrapingStats(req, res) {
    try {
      const [statsResult] = await db.execute(`
        SELECT 
          COUNT(*) as totalScraped,
          COUNT(CASE WHEN sourceURL IS NOT NULL THEN 1 END) as fromScraping,
          AVG(enPx * boyPx) as avgPixelCount,
          COUNT(CASE WHEN scrapedAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as lastDay
        FROM Ledler
      `);
      
      const stats = statsResult[0];
      
      res.json({
        success: true,
        stats: {
          total: stats.totalScraped,
          fromScraping: stats.fromScraping,
          averagePixelCount: Math.round(stats.avgPixelCount || 0),
          scrapedLastDay: stats.lastDay
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Toplu URL scraping
  static async scrapeBulkURLs(req, res) {
    try {
      const { urls, selectors, autoImport } = req.body;
      
      if (!urls || urls.length === 0) {
        return res.status(400).json({ error: 'URL listesi gerekli' });
      }
      
      console.log(`🔄 Toplu scraping başlatılıyor: ${urls.length} URL`);
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`📥 Processing ${i + 1}/${urls.length}: ${url}`);
        
        try {
          const scrapeResult = await ScraperController.scrapeProductInternal(url, selectors);
          results.push(scrapeResult);
          
          // Otomatik import
          if (autoImport && scrapeResult.width && scrapeResult.height) {
            await db.execute(
              'INSERT INTO Ledler (ledKodu, enPx, boyPx, tip, ozelDurum, notlar, masterTipi, sourceURL, scrapedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                scrapeResult.ledCode,
                scrapeResult.width,
                scrapeResult.height,
                scrapeResult.type,
                scrapeResult.status || 'Aktif',
                `Otomatik import: ${url}\nAçıklama: ${scrapeResult.description}`,
                ScraperController.determineMasterType(scrapeResult.width, scrapeResult.height),
                url,
                new Date()
              ]
            );
            scrapeResult.imported = true;
          }
          
          // Rate limiting
          if (i < urls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`❌ URL scraping hatası [${url}]:`, error.message);
          errors.push({
            url: url,
            error: error.message
          });
        }
      }
      
      console.log(`✅ Toplu scraping tamamlandı: ${results.length} başarılı, ${errors.length} hata`);
      
      res.json({
        success: true,
        results: results,
        errors: errors,
        summary: {
          total: urls.length,
          successful: results.length,
          failed: errors.length,
          imported: results.filter(r => r.imported).length
        }
      });
      
    } catch (error) {
      console.error('❌ Bulk scraping hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Görsel indirme ve proje oluşturma
  static async downloadAndSaveImages(req, res) {
    try {
      const { images, projectId } = req.body;
      
      if (!images || images.length === 0) {
        return res.status(400).json({ error: 'Görsel listesi gerekli' });
      }
      
      const downloadedImages = [];
      const uploadDir = path.join(__dirname, '../uploads/assets');
      
      // Upload klasörünü oluştur
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        
        try {
          console.log(`📥 Downloading image ${i + 1}/${images.length}: ${imageUrl}`);
          
          const response = await axios.get(imageUrl, {
            responseType: 'stream',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          const fileName = `image_${Date.now()}_${i + 1}.jpg`;
          const filePath = path.join(uploadDir, fileName);
          const relativePath = `uploads/assets/${fileName}`;
          
          const writer = fs.createWriteStream(filePath);
          response.data.pipe(writer);
          
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          
          const stats = fs.statSync(filePath);
          
          // Asset'i veritabanına kaydet
          if (projectId) {
            await db.execute(
              'INSERT INTO Assets (assetName, assetType, filePath, fileSize, projectID, sourceURL, isDownloaded, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [
                `Downloaded Image ${i + 1}`,
                '2D_logo',
                relativePath,
                stats.size,
                projectId,
                imageUrl,
                true,
                new Date()
              ]
            );
          }
          
          downloadedImages.push({
            fileName: fileName,
            filePath: relativePath,
            fileSize: stats.size,
            originalUrl: imageUrl
          });
          
        } catch (error) {
          console.error(`Görsel indirme hatası:`, error.message);
        }
      }
      
      res.json({
        success: true,
        downloadedImages: downloadedImages,
        summary: {
          totalRequested: images.length,
          successfullyDownloaded: downloadedImages.length,
          totalSize: downloadedImages.reduce((sum, img) => sum + img.fileSize, 0)
        }
      });
      
    } catch (error) {
      console.error('❌ Görsel indirme hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Tam proje oluşturma (scraping + project + assets)
  static async scrapeAndCreateProject(req, res) {
    try {
      const { url, selectors, projectName } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL gerekli' });
      }
      
      console.log(`🔄 Tam proje oluşturuluyor: ${url}`);
      
      // 1. URL'yi scrape et
      const productData = await ScraperController.scrapeProductInternal(url, selectors || {});
      
      let projectId = null;
      let ledId = null;
      const downloadedImages = [];
      
      // 2. Proje oluştur
      if (projectName || productData.name) {
        const finalProjectName = projectName || productData.name || 'Scraped Project';
        
        const [projectResult] = await db.execute(
          'INSERT INTO Projects (projectName, projectType, status, createdAt) VALUES (?, ?, ?, ?)',
          [finalProjectName, 'mixed', 'active', new Date()]
        );
        
        projectId = projectResult.insertId;
        console.log(`✅ Proje oluşturuldu: ${finalProjectName} (ID: ${projectId})`);
      }
      
      // 3. LED kaydı oluştur
      if (productData.width && productData.height) {
        const [ledResult] = await db.execute(
          'INSERT INTO Ledler (ledKodu, enPx, boyPx, tip, ozelDurum, notlar, masterTipi, sourceURL, scrapedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            productData.ledCode,
            productData.width,
            productData.height,
            productData.type,
            'Aktif',
            `Otomatik import: ${url}\nAçıklama: ${productData.description}`,
            ScraperController.determineMasterType(productData.width, productData.height),
            url,
            new Date()
          ]
        );
        
        ledId = ledResult.insertId;
        console.log(`✅ LED kaydı oluşturuldu: ${productData.ledCode} (ID: ${ledId})`);
      }
      
      // 4. Görselleri indir ve asset olarak kaydet
      if (productData.images && productData.images.length > 0 && projectId) {
        const uploadDir = path.join(__dirname, '../uploads/assets');
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        for (let i = 0; i < Math.min(productData.images.length, 5); i++) {
          const imageUrl = productData.images[i];
          
          try {
            console.log(`📥 Görsel indiriliyor ${i + 1}: ${imageUrl}`);
            
            const response = await axios.get(imageUrl, {
              responseType: 'stream',
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            
            const fileName = `${productData.name}_${Date.now()}_${i + 1}.jpg`.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = path.join(uploadDir, fileName);
            const relativePath = `uploads/assets/${fileName}`;
            
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
              writer.on('finish', resolve);
              writer.on('error', reject);
            });
            
            const stats = fs.statSync(filePath);
            
            // Asset olarak kaydet
            await db.execute(
              'INSERT INTO Assets (assetName, assetType, filePath, fileSize, projectID, sourceURL, isDownloaded, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [
                `${productData.name || 'Scraped'} Image ${i + 1}`,
                '2D_logo',
                relativePath,
                stats.size,
                projectId,
                imageUrl,
                true,
                new Date()
              ]
            );
            
            downloadedImages.push({
              fileName: fileName,
              filePath: relativePath,
              fileSize: stats.size,
              originalUrl: imageUrl
            });
            
          } catch (error) {
            console.error(`Görsel indirme hatası:`, error.message);
          }
        }
      }
      
      res.json({
        success: true,
        productData: productData,
        projectId: projectId,
        ledId: ledId,
        downloadedImages: downloadedImages,
        summary: {
          projectCreated: !!projectId,
          ledCreated: !!ledId,
          imagesDownloaded: downloadedImages.length,
          totalImageSize: downloadedImages.reduce((sum, img) => sum + img.fileSize, 0)
        }
      });
      
    } catch (error) {
      console.error('❌ Tam proje oluşturma hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Görsel optimizasyonu
  static async optimizeScrapedImages(req, res) {
    try {
      const { projectId } = req.params;
      const { quality = 80, maxWidth = 1920, maxHeight = 1080 } = req.body;
      
      // Bu metod şimdilik basit bir placeholder
      // Gerçek optimizasyon için sharp veya jimp kullanılabilir
      
      res.json({
        success: true,
        message: 'Görsel optimizasyonu henüz implementasyonda',
        projectId: projectId,
        settings: { quality, maxWidth, maxHeight }
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Internal helper methods
  static async scrapeProductInternal(url, selectors) {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    const productData = {
      name: $(selectors.name || 'h1, .product-title, .title').first().text().trim(),
      width: ScraperController.extractNumber($(selectors.width || '.width, .en, [data-width], .dimension-w').first().text()),
      height: ScraperController.extractNumber($(selectors.height || '.height, .boy, [data-height], .dimension-h').first().text()),
      description: $(selectors.description || '.description, .product-description, p').first().text().trim(),
      images: []
    };
    
    // Görselleri topla
    $(selectors.images || 'img, .product-image img, .gallery img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && src.startsWith('http')) {
        productData.images.push(src);
      }
    });
    
    // LED kodu oluştur
    productData.ledCode = productData.name 
      ? productData.name.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
      : `LED_${Date.now()}`;
    
    // Tip belirle
    if (productData.width && productData.height) {
      const ratio = productData.width / productData.height;
      productData.type = ratio > 1.5 ? 'Landscape' : ratio < 0.7 ? 'Portrait' : 'Square';
    }
    
    return productData;
  }

  static extractNumber(text) {
    if (!text) return null;
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  static determineMasterType(width, height) {
    const ratio = width / height;
    if (ratio > 1.5) return 'Landscape Master';
    if (ratio < 0.7) return 'Portrait Master';
    return 'Square Master';
  }
}

module.exports = ScraperController;