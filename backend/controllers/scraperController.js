module.exports = router;// backend/controllers/scraperController.js
const axios = require('axios');
const cheerio = require('cheerio');
const LedModel = require('../models/ledModel');

class ScraperController {
  // URL'den ürün verilerini çek
  static async scrapeProduct(req, res) {
    try {
      const { url, selectors } = req.body;
      
      console.log('🔍 Scraping URL:', url);
      
      // Web sayfasını getir
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Ürün bilgilerini çek
      const productData = {
        name: $(selectors.name || 'h1').first().text().trim(),
        width: extractNumber($(selectors.width || '.width, .en, [data-width]').first().text()),
        height: extractNumber($(selectors.height || '.height, .boy, [data-height]').first().text()),
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
      productData.ledCode = generateLEDCode(productData);
      
      // Aspect ratio hesapla
      if (productData.width && productData.height) {
        productData.aspectRatio = (productData.width / productData.height).toFixed(3);
        productData.area = productData.width * productData.height;
        productData.type = categorizeByAspectRatio(productData.width / productData.height);
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
        error: 'URL\'den veri çekilemedi: ' + error.message,
        details: error.code 
      });
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
          // URL'yi scrape et
          const scrapeResult = await ScraperController.scrapeProductInternal(url, selectors);
          results.push(scrapeResult);
          
          // Otomatik import varsa veritabanına ekle
          if (autoImport && scrapeResult.width && scrapeResult.height) {
            const               ledData = {
              ledKodu: scrapeResult.ledCode,
              enPx: scrapeResult.width,
              boyPx: scrapeResult.height,
              tip: scrapeResult.type,
              ozelDurum: scrapeResult.status || 'Aktif',
              notlar: `Otomatik import: ${url}\nAçıklama: ${scrapeResult.description}`,
              masterTipi: determineMasterType(scrapeResult.width, scrapeResult.height)
            };
            
            await LedModel.create(ledData);
            scrapeResult.imported = true;
          }
          
          // Rate limiting için bekle
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
  
  // Internal scraping function
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
      width: extractNumber($(selectors.width || '.width, .en, [data-width], .dimension-w').first().text()),
      height: extractNumber($(selectors.height || '.height, .boy, [data-height], .dimension-h').first().text()),
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
    productData.ledCode = generateLEDCode(productData);
    
    // Hesaplamalar
    if (productData.width && productData.height) {
      productData.aspectRatio = (productData.width / productData.height).toFixed(3);
      productData.area = productData.width * productData.height;
      productData.type = categorizeByAspectRatio(productData.width / productData.height);
    }
    
    return productData;
  }
  
  // Önceden tanımlanmış site şablonları
  static async getPresetSelectors(req, res) {
    const presets = {
      'generic': {
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
      'trendyol': {
        name: '.pr-new-br span',
        width: '.product-detail-info .detail:contains("En") .value',
        height: '.product-detail-info .detail:contains("Boy") .value',
        price: '.prc-dsc',
        store: '.merchant-name',
        description: '.product-detail-info .detail-desc',
        images: '.product-detail-picture img'
      },
      'hepsiburada': {
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
    
    res.json({
      success: true,
      presets: presets,
      usage: 'Hazır şablonları kullanarak farklı site tiplerinden veri çekebilirsiniz'
    });
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

  // ✅ YENİ: Görsel indirme ve asset oluşturma
  static async downloadAndSaveImages(req, res) {
    try {
      const { imageUrls, productId, productName } = req.body;
      
      if (!imageUrls || imageUrls.length === 0) {
        return res.status(400).json({ error: 'En az bir görsel URL gerekli' });
      }
      
      console.log(`📸 ${imageUrls.length} görsel indiriliyor...`);
      
      const downloadedImages = [];
      const errors = [];
      
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        
        try {
          console.log(`📥 Görsel indiriliyor: ${imageUrl}`);
          
          // Görseli indir
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
          
          // Dosya adı oluştur
          const timestamp = Date.now();
          const fileName = `${productName || 'product'}_${productId || 'scraped'}_${i + 1}_${timestamp}${extension}`;
          const filePath = path.join('uploads', 'scraped-images', fileName);
          
          // Klasörü oluştur
          const uploadDir = path.join('uploads', 'scraped-images');
          if (!require('fs').existsSync(uploadDir)) {
            require('fs').mkdirSync(uploadDir, { recursive: true });
          }
          
          // Dosyayı kaydet
          const writer = require('fs').createWriteStream(filePath);
          response.data.pipe(writer);
          
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          
          // Dosya boyutunu al
          const stats = require('fs').statSync(filePath);
          
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
  
  // ✅ YENİ: Gelişmiş scraping + görsel indirme + asset oluşturma
  class ScraperController {
  static async scrapeAndCreateProject(req, res) {
    try {
      const { url, selectors, projectSettings, downloadImages = true } = req.body;
      
      console.log('🎬 Tam proje oluşturma başlatılıyor:', url);
      
      // 1. Ürün bilgilerini scrape et
      const productData = await ScraperController.scrapeProductInternal(url, selectors);
      
      // 2. Proje oluştur
      let projectId = null;
      if (projectSettings?.createProject) {
        const ProjectModel = require('../models/projectModel');
        const projectResult = await ProjectModel.create({
          projectName: productData.name || `Scraped Project ${Date.now()}`,
          projectType: projectSettings.projectType || 'mixed',
          description: `Otomatik scraping: ${url}\n${productData.description || ''}`
        });
        projectId = projectResult.insertId;
        console.log(`📁 Proje oluşturuldu: ID ${projectId}`);
      }
      
      // 3. Görselleri indir
      let downloadedImages = [];
      if (downloadImages && productData.images && productData.images.length > 0) {
        console.log(`📸 ${productData.images.length} görsel indiriliyor...`);
        
        for (const imageUrl of productData.images.slice(0, 10)) { // Max 10 görsel
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
            
            const fileName = `${productData.ledCode || 'scraped'}_${Date.now()}${extension}`;
            const filePath = path.join('uploads', 'scraped-assets', fileName);
            
            const uploadDir = path.join('uploads', 'scraped-assets');
            if (!require('fs').existsSync(uploadDir)) {
              require('fs').mkdirSync(uploadDir, { recursive: true });
            }
            
            const writer = require('fs').createWriteStream(filePath);
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
              writer.on('finish', resolve);
              writer.on('error', reject);
            });
            
            const stats = require('fs').statSync(filePath);
            
            // Asset olarak kaydet
            if (projectId) {
              const AssetModel = require('../models/assetModel');
              await AssetModel.create({
                assetName: `${productData.name || 'Scraped'} Image`,
                assetType: '2D_logo', // Varsayılan tip
                filePath: filePath,
                fileSize: stats.size,
                projectID: projectId
              });
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
      
      // 4. LED kaydı oluştur (eğer boyutlar varsa)
      let ledId = null;
      if (productData.width && productData.height && projectSettings?.createLED) {
        const LedModel = require('../models/ledModel');
        const ledResult = await LedModel.create({
          ledKodu: productData.ledCode,
          enPx: productData.width,
          boyPx: productData.height,
          tip: productData.type,
          ozelDurum: productData.status || 'Aktif',
          notlar: `Otomatik scraping: ${url}\nPrije ID: ${projectId}\nGörsel sayısı: ${downloadedImages.length}`,
          masterTipi: determineMasterType(productData.width, productData.height)
        });
        ledId = ledResult.insertId;
        console.log(`💡 LED kaydı oluşturuldu: ID ${ledId}`);
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
  
  // ✅ YENİ: Görsel kalite kontrolü ve optimizasyon
  static async optimizeScrapedImages(req, res) {
    try {
      const { projectId } = req.params;
      const sharp = require('sharp'); // npm install sharp gerekli
      
      const AssetModel = require('../models/assetModel');
      const assets = await AssetModel.getByProject(projectId);
      
      const optimizedAssets = [];
      
      for (const asset of assets) {
        if (asset.assetType === '2D_logo' && asset.filePath) {
          try {
            const originalPath = asset.filePath;
            const optimizedPath = originalPath.replace('.', '_optimized.');
            
            // Görsel optimizasyonu
            await sharp(originalPath)
              .resize(2000, 2000, { 
                fit: 'inside', 
                withoutEnlargement: true 
              })
              .jpeg({ 
                quality: 85, 
                progressive: true 
              })
              .toFile(optimizedPath);
            
            const originalStats = require('fs').statSync(originalPath);
            const optimizedStats = require('fs').statSync(optimizedPath);
            
            optimizedAssets.push({
              assetId: asset.assetID,
              originalSize: originalStats.size,
              optimizedSize: optimizedStats.size,
              savings: ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(1) + '%'
            });
            
          } catch (error) {
            console.error(`Optimizasyon hatası [${asset.assetID}]:`, error.message);
          }
        }
      }
      
      res.json({
        success: true,
        optimizedAssets: optimizedAssets,
        totalSavings: optimizedAssets.reduce((sum, asset) => 
          sum + (asset.originalSize - asset.optimizedSize), 0
        )
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// Yardımcı fonksiyonlar
function extractNumber(text) {
  if (!text) return null;
  const matches = text.match(/\d+/);
  return matches ? parseInt(matches[0]) : null;
}

function generateLEDCode(productData) {
  const prefix = productData.store ? productData.store.substring(0, 3).toUpperCase() : 'LED';
  const timestamp = Date.now().toString().slice(-6);
  const dimensions = productData.width && productData.height ? 
    `_${productData.width}x${productData.height}` : '';
  return `${prefix}${timestamp}${dimensions}`;
}

function categorizeByAspectRatio(ratio) {
  if (ratio < 0.1) return 'Çok Dar Dikey';
  if (ratio < 0.8) return 'Dikey';
  if (ratio < 1.2) return 'Kare';
  if (ratio < 7) return 'Yatay';
  return 'Çok Geniş Yatay';
}

function determineMasterType(width, height) {
  const ratio = width / height;
  if (ratio < 0.8) return 'Dikey';
  if (ratio < 1.2) return 'Kare';
  if (ratio < 2) return 'Yatay';
  return 'Uzun';
}

module.exports = ScraperController;