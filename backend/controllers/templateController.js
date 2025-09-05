const db = require('../config/database');

class TemplateController {
  // Tüm template'leri getir
  static async getAllTemplates(req, res) {
    try {
      const [templates] = await db.execute(`
        SELECT 
          t.*,
          u.username as authorName,
          COUNT(tu.usageID) as usageCount
        FROM Templates t
        LEFT JOIN Users u ON t.authorID = u.userID
        LEFT JOIN TemplateUsage tu ON t.templateID = tu.templateID
        WHERE t.isActive = TRUE 
        GROUP BY t.templateID
        ORDER BY t.templateType ASC, t.templateName ASC
      `);
      res.json({ success: true, data: templates });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Template oluştur
  static async createTemplate(req, res) {
    try {
      const { 
        templateName, 
        templateType, 
        duration, 
        templatePath,
        previewImage,
        defaultSettings,
        compatibleAssetTypes
      } = req.body;
      
      const [result] = await db.execute(`
        INSERT INTO Templates (
          templateName, 
          templateType, 
          duration, 
          templatePath,
          previewImage,
          defaultSettings,
          compatibleAssetTypes,
          authorID
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        templateName, 
        templateType, 
        duration,
        templatePath,
        previewImage,
        JSON.stringify(defaultSettings),
        JSON.stringify(compatibleAssetTypes),
        req.user.userID
      ]);

      res.status(201).json({
        success: true,
        templateID: result.insertId,
        message: 'Template oluşturuldu'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Template güncelle
  static async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { 
        templateName, 
        templateType, 
        duration, 
        templatePath,
        previewImage,
        defaultSettings,
        compatibleAssetTypes,
        isActive 
      } = req.body;

      const [result] = await db.execute(`
        UPDATE Templates 
        SET templateName = ?, templateType = ?, duration = ?, 
            templatePath = ?, previewImage = ?, defaultSettings = ?,
            compatibleAssetTypes = ?, isActive = ?
        WHERE templateID = ?
      `, [
        templateName, 
        templateType, 
        duration,
        templatePath,
        previewImage,
        JSON.stringify(defaultSettings),
        JSON.stringify(compatibleAssetTypes),
        isActive, 
        id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Template bulunamadı' });
      }

      res.json({ success: true, message: 'Template güncellendi' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Template sil
  static async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const [result] = await db.execute(`
        DELETE FROM Templates WHERE templateID = ?
      `, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Template bulunamadı' });
      }

      res.json({ success: true, message: 'Template silindi' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Template kullanımını kaydet
  static async logTemplateUsage(req, res) {
    try {
      const { templateID, projectID } = req.body;
      
      await db.execute(`
        INSERT INTO TemplateUsage (templateID, projectID, userID)
        VALUES (?, ?, ?)
      `, [templateID, projectID, req.user.userID]);

      res.json({ success: true, message: 'Template kullanımı kaydedildi' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Tip bazında template'leri getir
  static async getTemplatesByType(req, res) {
    try {
      const { type } = req.params;
      
      const [templates] = await db.execute(`
        SELECT * FROM Templates 
        WHERE templateType = ? AND isActive = TRUE 
        ORDER BY templateName ASC
      `, [type]);

      res.json({ success: true, data: templates });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Template istatistikleri
  static async getTemplateStats(req, res) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as totalTemplates,
          COUNT(CASE WHEN templateType = 'shoe_in_out' THEN 1 END) as shoeTemplates,
          COUNT(CASE WHEN templateType = 'logo_intro' THEN 1 END) as logoIntroTemplates,
          COUNT(CASE WHEN templateType = 'logo_outro' THEN 1 END) as logoOutroTemplates,
          COUNT(CASE WHEN templateType = 'transition' THEN 1 END) as transitionTemplates,
          AVG(duration) as avgDuration
        FROM Templates 
        WHERE isActive = TRUE
      `);

      const [mostUsed] = await db.execute(`
        SELECT 
          t.templateName,
          COUNT(tu.usageID) as usageCount
        FROM Templates t
        LEFT JOIN TemplateUsage tu ON t.templateID = tu.templateID
        WHERE t.isActive = TRUE
        GROUP BY t.templateID
        ORDER BY usageCount DESC
        LIMIT 5
      `);

      res.json({ 
        success: true, 
        stats: stats[0],
        mostUsedTemplates: mostUsed
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = TemplateController;