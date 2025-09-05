const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

class ScraperController {
  // Presets getir
  static async getPresets(req, res) {
    try {
      const presets = {
        generic: {
          name: 'h1, .product-title, .title',
          width: '.width, .en, [data-width], .w',
          height: '.height, .boy, [data-height], .h',
          price: '.price, .fiyat, .amount, .cost',
          store: '.store, .magaza, .shop-name',
          city: '.city, .sehir, .location',
          status: '.status, .durum, .stock',
          description: '.description, .aciklama, .details',
          images: 'img, .product-image img'
        },
        trendyol: {
          name: '.pr-new-br span',
          width: '.product-detail-info .detail:contains("En") .value',
          height: '.product-detail-info .detail:contains("Boy") .value',
          price: '.prc-dsc',
          store: '.merchant-name',
          description: '.product-detail-info .detail-desc',
          images: '.product-detail-picture img'
        },
        hepsiburada: {
          name: '.product_name',
          width: '.data-sheet tr:contains("En") td:last-child',
          height: '.data-sheet tr:contains("Boy") td:last-child',
          price: '.price-current',
          store: '.merchant-name',
          description: '.product-description',
          images: '.product-images img'
        },
        'custom-led': {
          name: '.led-title, .panel-name',
          width: '.dimensions .width, .spec-width',
          height: '.dimensions .height, .spec-height',
          price: '.led-price, .panel-cost',
          store: '.supplier, .vendor',
          city: '.location, .city-info',
          status: '.stock-status, .availability',
          description: '.specifications, .led-specs',
          images: '.led-gallery img, .panel-images img'
        }
      };
      
      res.json({ success: true, presets });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Tek URL scraping
  static async scrapeProduct(req, res) {
    try {
      const { url, selectors } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL gerekli' });
      }

      console.log('🔍 Scraping URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      const productData = {
        name: $(selectors.name || 'h1').first().text().trim(),
        width: ScraperController.extractNumber($(selectors.width || '.width, .en, [data-width]').first().text()),
        height: ScraperController.extractNumber($(selectors.height || '.height, .boy, [data-height]').first().text()),
        price: $(selectors.price || '.price, .fiyat').first().text().trim(),
        store: $(selectors.store || '.store, .magaza').first().text().trim(),
        city: $(selectors.city || '.city, .sehir, .location').first().text().trim(),
        status: $(selectors.status || '.status, .durum').first().text().trim() || 'Aktif',
        description: $(selectors.description || '.description, .aciklama').first().text().trim(),
        images: []
      };
      
      // Görsel URL'lerini çek
      $(selectors.images || 'img').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src && (src.includes('http') || src.startsWith('/'))) {
          productData.images.push(src.startsWith('/') ? new URL(src, url).href : src);
        }
      });
      
      // LED kodu oluştur
      productData.ledCode = ScraperController.generateLEDCode(productData);
      
      // Aspect ratio hesapla
      if (productData.width && productData.height) {
        productData.aspectRatio = (productData.width / productData.height).toFixed(3);
        productData.area = productData.width * productData.height;
        productData.type = ScraperController.categorizeByAspectRatio(productData.width / productData.height);
      }
      
      console.log('📊 Scraping sonucu:', productData);
      
      res.json({
        success: true,
        data: productData,
        url: url,
        scrapedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Scraping hatası:', error.message);
      res.status(500).json({ 
        error: 'URL\'den veri çekilemedi: ' + error.message
      });
    }
  }

  // Görsel indirme
  static async downloadAndSaveImages(req, res) {
    try {
      const { imageUrls, productId, productName } = req.body;
      
      if (!imageUrls || imageUrls.length === 0) {
        return res.status(400).json({ error: 'En az bir görsel URL gerekli' });
      }
      
      console.log(`📸 ${imageUrls.length} görsel indiriliyor...`);
      
      const downloadedImages = [];
      const errors = [];
      
      // Uploads klasörünü oluştur
      const uploadDir = path.join('uploads', 'scraped-images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        
        try {
          console.log(`📥 Görsel indiriliyor: ${imageUrl}`);
          
          const response = await axios.get(imageUrl, {
            responseType: 'stream',
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          // Dosya uzantısını belirle
          const contentType = response.headers['content-type'];
          let extension = '.jpg';
          if (contentType) {
            if (contentType.includes('png')) extension = '.png';
            if (contentType.includes('gif')) extension = '.gif';
            if (contentType.includes('webp')) extension = '.webp';
          }
          
          const timestamp = Date.now();
          const fileName = `${productName || 'product'}_${productId || 'scraped'}_${i + 1}_${timestamp}${extension}`;
          const filePath = path.join(uploadDir, fileName);
          
          // Dosyayı kaydet
          const writer = fs.createWriteStream(filePath);
          response.data.pipe(writer);
          
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          
          const stats = fs.statSync(filePath);
          
          downloadedImages.push({
            originalUrl: imageUrl,
            fileName: fileName,
            filePath: filePath,
            fileSize: stats.size,
            contentType: contentType,
            downloadedAt: new Date().toISOString()
          });
          
          console.log(`✅ Görsel kaydedildi: ${fileName} (${(stats.size / 1024).toFixed(1)} KB)`);
          
        } catch (error) {
          console.error(`❌ Görsel indirme hatası [${imageUrl}]:`, error.message);
          errors.push({
            url: imageUrl,
            error: error.message
          });
        }
        
        // Rate limiting
        if (i < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      res.json({
        success: true,
        downloadedImages: downloadedImages,
        errors: errors,
        summary: {
          requested: imageUrls.length,
          downloaded: downloadedImages.length,
          failed: errors.length,
          totalSize: downloadedImages.reduce((sum, img) => sum + img.fileSize, 0)
        }
      });
      
    } catch (error) {
      console.error('❌ Görsel indirme sistemi hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Tam proje oluşturma
  static async scrapeAndCreateProject(req, res) {
    try {
      const { url, selectors, projectSettings, downloadImages = true, imageSettings } = req.body;
      
      console.log('🎬 Tam proje oluşturma başlatılıyor:', url);
      
      // 1. Ürün bilgilerini scrape et
      const productData = await ScraperController.scrapeProductInternal(url, selectors);
      
      // 2. Proje oluştur
      let projectId = null;
      if (projectSettings?.createProject) {
        const [projectResult] = await db.execute(
          'INSERT INTO Projects (projectName, projectType, description) VALUES (?, ?, ?)',
          [
            projectSettings.projectName || productData.name || `Scraped Project ${Date.now()}`,
            projectSettings.projectType || 'mixed',
            `Otomatik scraping: ${url}\n${productData.description || ''}`
          ]
        );
        projectId = projectResult.insertId;
        console.log(`📁 Proje oluşturuldu: ID ${projectId}`);
      }
      
      // 3. LED kaydı oluştur
      let ledId = null;
      if (productData.width && productData.height && projectSettings?.createLED) {
        const [ledResult] = await db.execute(
          'INSERT INTO Ledler (ledKodu, enPx, boyPx, tip, ozelDurum, notlar, sourceURL, scrapedAt, linkedProjectID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            productData.ledCode,
            productData.width,
            productData.height,
            productData.type,
            productData.status || 'Aktif',
            `Otomatik scraping: ${url}\nPrije ID: ${projectId}`,
            url,
            new Date(),
            projectId
          ]
        );
        ledId = ledResult.insertId;
        console.log(`💡 LED kaydı oluşturuldu: ID ${ledId}`);
      }
      
      // 4. Görselleri indir ve asset olarak kaydet
      let downloadedImages = [];
      if (downloadImages && productData.images && productData.images.length > 0) {
        console.log(`📸 ${productData.images.length} görsel indiriliyor...`);
        
        const uploadDir = path.join('uploads', 'scraped-assets');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        for (let i = 0; i < Math.min(productData.images.length, 10); i++) {
          const imageUrl = productData.images[i];
          
          try {
            const response = await axios.get(imageUrl, {
              responseType: 'stream',
              timeout: 15000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            
            const contentType = response.headers['content-type'];
            let extension = '.jpg';
            if (contentType?.includes('png')) extension = '.png';
            if (contentType?.includes('gif')) extension = '.gif';
            if (contentType?.includes('webp')) extension = '.webp';
            
            const fileName = `${productData.ledCode || 'scraped'}_${i + 1}_${Date.now()}${extension}`;
            const filePath = path.join(uploadDir, fileName);
            
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
              writer.on('finish', resolve);
              writer.on('error', reject);
            });
            
            const stats = fs.statSync(filePath);
            
            // Asset olarak kaydet
            if (projectId) {
              await db.execute(
                'INSERT INTO Assets (assetName, assetType, filePath, fileSize, projectID, originalURL, isFromScraper, scrapedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  `${productData.name || 'Scraped'} Image ${i + 1}`,
                  '2D_logo',
                  filePath,
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
              filePath: filePath,
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

  // Toplu URL scraping
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

  // Internal scraping helper
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
      price: $(selectors.price || '.price, .fiyat, .amount').first().text().trim(),
      store: $(selectors.store || '.store, .magaza, .shop-name').first().text().trim(),
      city: $(selectors.city || '.city, .sehir, .location, .address').first().text().trim(),
      status: $(selectors.status || '.status, .durum, .availability').first().text().trim() || 'Aktif',
      description: $(selectors.description || '.description, .aciklama, .details').first().text().trim(),
      category: $(selectors.category || '.category, .kategori').first().text().trim(),
      brand: $(selectors.brand || '.brand, .marka').first().text().trim(),
      model: $(selectors.model || '.model').first().text().trim(),
      images: []
    };
    
    // Görsel URL'lerini çek
    $(selectors.images || 'img, .product-image img, .gallery img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && (src.includes('http') || src.startsWith('/'))) {
        productData.images.push(src.startsWith('/') ? new URL(src, url).href : src);
      }
    });
    
    // LED kodu oluştur
    productData.ledCode = ScraperController.generateLEDCode(productData);
    
    // Hesaplamalar
    if (productData.width && productData.height) {
      productData.aspectRatio = (productData.width / productData.height).toFixed(3);
      productData.area = productData.width * productData.height;
      productData.type = ScraperController.categorizeByAspectRatio(productData.width / productData.height);
    }
    
    return productData;
  }

  // Yardımcı fonksiyonlar
  static extractNumber(text) {
    if (!text) return null;
    const matches = text.match(/\d+/);
    return matches ? parseInt(matches[0]) : null;
  }

  static generateLEDCode(productData) {
    const prefix = productData.store ? productData.store.substring(0, 3).toUpperCase() : 'LED';
    const timestamp = Date.now().toString().slice(-6);
    const dimensions = productData.width && productData.height ? 
      `_${productData.width}x${productData.height}` : '';
    return `${prefix}${timestamp}${dimensions}`;
  }

  static categorizeByAspectRatio(ratio) {
    if (ratio < 0.1) return 'Çok Dar Dikey';
    if (ratio < 0.8) return 'Dikey';
    if (ratio < 1.2) return 'Kare';
    if (ratio < 7) return 'Yatay';
    return 'Çok Geniş Yatay';
  }

  static determineMasterType(width, height) {
    const ratio = width / height;
    if (ratio < 0.8) return 'Dikey';
    if (ratio < 1.2) return 'Kare';
    if (ratio < 2) return 'Yatay';
    return 'Uzun';
  }

  // Scraping istatistikleri
  static async getScrapingStats(req, res) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as totalImports,
          COUNT(CASE WHEN notlar LIKE '%Otomatik import%' THEN 1 END) as autoImports,
          DATE(createdAt) as date,
          COUNT(*) as dailyCount
        FROM Ledler 
        WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
        LIMIT 30
      `);
      
      res.json({
        success: true,
        stats: stats,
        summary: {
          last30Days: stats.reduce((sum, day) => sum + day.dailyCount, 0),
          autoImportsRatio: stats.length > 0 ? 
            (stats.reduce((sum, day) => sum + day.autoImports, 0) / stats.reduce((sum, day) => sum + day.dailyCount, 0) * 100).toFixed(1) + '%' : '0%'
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ScraperController;