// backend/controllers/reportsController.js - DÜZELTME
const db = require('../config/database');

class ReportsController {
  // Dashboard istatistikleri
  static async getDashboardStats(req, res) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM Ledler) as toplamLED,
          (SELECT COUNT(*) FROM Magazalar) as toplamMagaza,
          (SELECT COUNT(DISTINCT tip) FROM Ledler WHERE tip IS NOT NULL) as toplamTip,
          (SELECT COUNT(*) FROM Ledler WHERE DATE(createdAt) = CURDATE()) as bugunEklenen,
          (SELECT COUNT(*) FROM Ledler WHERE DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as haftalikEklenen,
          (SELECT COUNT(*) FROM Ledler WHERE DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as aylikEklenen
      `);

      const [tipDagilimi] = await db.execute(`
        SELECT tip, COUNT(*) as adet, ROUND(AVG(enPx * boyPx), 0) as ortalamaBoyut
        FROM Ledler 
        WHERE tip IS NOT NULL 
        GROUP BY tip 
        ORDER BY adet DESC
      `);

      const [sehirDagilimi] = await db.execute(`
        SELECT m.sehir, COUNT(l.ledID) as adet
        FROM Magazalar m
        LEFT JOIN Ledler l ON m.magazaID = l.magazaID
        GROUP BY m.sehir
        ORDER BY adet DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        stats: stats[0],
        tipDagilimi,
        sehirDagilimi
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Aylık rapor
  static async getMonthlyReport(req, res) {
    try {
      const { year, month, sehir } = req.query;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (year && month) {
        whereClause += ' AND YEAR(l.createdAt) = ? AND MONTH(l.createdAt) = ?';
        params.push(year, month);
      }

      if (sehir) {
        whereClause += ' AND m.sehir = ?';
        params.push(sehir);
      }

      const [monthlyData] = await db.execute(`
        SELECT 
          l.tip,
          COUNT(*) as adet,
          AVG(l.enPx * l.boyPx) as ortalamaBoyut,
          MIN(l.enPx * l.boyPx) as enKucukBoyut,
          MAX(l.enPx * l.boyPx) as enBuyukBoyut,
          GROUP_CONCAT(DISTINCT m.sehir) as sehirler,
          DATE_FORMAT(l.createdAt, '%Y-%m') as donem
        FROM Ledler l
        LEFT JOIN Magazalar m ON l.magazaID = m.magazaID
        ${whereClause}
        GROUP BY l.tip, DATE_FORMAT(l.createdAt, '%Y-%m')
        ORDER BY donem DESC, adet DESC
      `, params);

      const [totalStats] = await db.execute(`
        SELECT 
          COUNT(*) as toplamAdet,
          COUNT(DISTINCT l.tip) as farkliTipSayisi,
          COUNT(DISTINCT m.sehir) as farkliSehirSayisi,
          AVG(l.enPx * l.boyPx) as genelOrtalamaBoyut
        FROM Ledler l
        LEFT JOIN Magazalar m ON l.magazaID = m.magazaID
        ${whereClause}
      `, params);

      res.json({
        success: true,
        data: {
          monthlyBreakdown: monthlyData,
          summary: totalStats[0],
          filters: { year, month, sehir }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ CSV Export - DÜZELTİLDİ
  static async exportToCSV(req, res) {
    try {
      console.log('📁 CSV Export başlatılıyor...', req.body);
      
      const { 
        startDate, 
        endDate, 
        sehir, 
        tip, 
        includeInactive = false 
      } = req.body;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (startDate && endDate) {
        whereClause += ' AND DATE(l.createdAt) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      if (sehir && Array.isArray(sehir) && sehir.length > 0) {
        whereClause += ` AND m.sehir IN (${sehir.map(() => '?').join(',')})`;
        params.push(...sehir);
      }

      if (tip && Array.isArray(tip) && tip.length > 0) {
        whereClause += ` AND l.tip IN (${tip.map(() => '?').join(',')})`;
        params.push(...tip);
      }

      if (!includeInactive) {
        whereClause += ' AND (l.ozelDurum IS NULL OR l.ozelDurum != "Pasif")';
      }

      console.log('📊 SQL Query:', whereClause, params);

      const [exportData] = await db.execute(`
        SELECT 
          l.ledKodu as 'LED Kodu',
          l.enPx as 'En (px)',
          l.boyPx as 'Boy (px)',
          ROUND(l.aspect, 4) as 'Aspect Ratio',
          l.tip as 'Tip',
          COALESCE(l.ozelDurum, 'Aktif') as 'Durum',
          COALESCE(m.sehir, 'Belirtilmemiş') as 'Şehir',
          COALESCE(m.magazaAdi, 'Atanmamış') as 'Mağaza',
          COALESCE(l.notlar, '') as 'Notlar',
          DATE_FORMAT(l.createdAt, '%d.%m.%Y %H:%i') as 'Oluşturulma Tarihi',
          DATE_FORMAT(l.updatedAt, '%d.%m.%Y %H:%i') as 'Güncellenme Tarihi'
        FROM Ledler l
        LEFT JOIN Magazalar m ON l.magazaID = m.magazaID
        ${whereClause}
        ORDER BY l.createdAt DESC
      `, params);

      console.log(`📈 ${exportData.length} kayıt bulundu`);

      if (exportData.length === 0) {
        return res.status(404).json({ 
          error: 'Belirtilen kriterlere uygun veri bulunamadı' 
        });
      }

      // CSV formatında döndür
      const headers = Object.keys(exportData[0]);
      let csvContent = headers.join(',') + '\n';
      
      exportData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvContent += values.join(',') + '\n';
      });

      // ✅ Response headers düzeltildi
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="led-panels-${new Date().toISOString().split('T')[0]}.csv"`);
      
      // UTF-8 BOM for Excel compatibility
      const csvWithBOM = '\uFEFF' + csvContent;
      
      console.log('✅ CSV export başarılı');
      res.send(csvWithBOM);
      
    } catch (error) {
      console.error('❌ CSV export hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ReportsController;