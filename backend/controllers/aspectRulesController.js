// backend/controllers/aspectRulesController.js (YENİ DOSYA)
const db = require('../config/database');

class AspectRulesController {
  // Tüm kuralları getir
  static async getAllRules(req, res) {
    try {
      const [rules] = await db.execute(`
        SELECT ruleID, tipAdi, minRatio, maxRatio, masterWidth, masterHeight, isActive 
        FROM AspectRatioRules 
        ORDER BY minRatio ASC
      `);
      res.json({ success: true, data: rules });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Yeni kural ekle
  static async createRule(req, res) {
    try {
      const { tipAdi, minRatio, maxRatio, masterWidth, masterHeight } = req.body;

      // Çakışma kontrolü
      const [conflicts] = await db.execute(`
        SELECT tipAdi FROM AspectRatioRules 
        WHERE isActive = TRUE AND (
          (? BETWEEN minRatio AND maxRatio) OR 
          (? BETWEEN minRatio AND maxRatio) OR
          (minRatio BETWEEN ? AND ?) OR
          (maxRatio BETWEEN ? AND ?)
        )
      `, [minRatio, maxRatio, minRatio, maxRatio, minRatio, maxRatio]);

      if (conflicts.length > 0) {
        return res.status(409).json({ 
          error: 'Bu aralık mevcut kurallarla çakışıyor',
          conflicts: conflicts.map(c => c.tipAdi)
        });
      }

      const [result] = await db.execute(`
        INSERT INTO AspectRatioRules (tipAdi, minRatio, maxRatio, masterWidth, masterHeight) 
        VALUES (?, ?, ?, ?, ?)
      `, [tipAdi, minRatio, maxRatio, masterWidth, masterHeight]);

      res.status(201).json({
        success: true,
        ruleID: result.insertId,
        message: 'Kural başarıyla eklendi'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Kural güncelle
  static async updateRule(req, res) {
    try {
      const { id } = req.params;
      const { tipAdi, minRatio, maxRatio, masterWidth, masterHeight } = req.body;

      const [result] = await db.execute(`
        UPDATE AspectRatioRules 
        SET tipAdi = ?, minRatio = ?, maxRatio = ?, masterWidth = ?, masterHeight = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE ruleID = ?
      `, [tipAdi, minRatio, maxRatio, masterWidth, masterHeight, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Kural bulunamadı' });
      }

      res.json({ success: true, message: 'Kural güncellendi' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Kural sil
  static async deleteRule(req, res) {
    try {
      const { id } = req.params;
      
      const [result] = await db.execute(`
        DELETE FROM AspectRatioRules WHERE ruleID = ?
      `, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Kural bulunamadı' });
      }

      res.json({ success: true, message: 'Kural silindi' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // TÜM LED'LERİ YENİDEN SINIFLANDIR
  static async recalculateAllTypes(req, res) {
    try {
      // Tüm LED'leri al
      const [leds] = await db.execute('SELECT ledID, enPx, boyPx FROM Ledler');
      
      // Aktif kuralları al
      const [rules] = await db.execute(`
        SELECT tipAdi, minRatio, maxRatio 
        FROM AspectRatioRules 
        WHERE isActive = TRUE 
        ORDER BY minRatio ASC
      `);

      let updatedCount = 0;

      for (const led of leds) {
        const aspect = led.enPx / led.boyPx;
        let newType = 'Belirsiz';

        // Hangi kurala uyduğunu bul
        for (const rule of rules) {
          if (aspect >= rule.minRatio && aspect < rule.maxRatio) {
            newType = rule.tipAdi;
            break;
          }
        }

        // LED tipini güncelle
        await db.execute(
          'UPDATE Ledler SET tip = ? WHERE ledID = ?',
          [newType, led.ledID]
        );
        updatedCount++;
      }

      res.json({
        success: true,
        message: `${updatedCount} LED panelin tipi yeniden hesaplandı`,
        updatedCount
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AspectRulesController;