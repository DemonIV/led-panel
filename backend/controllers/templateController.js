const db = require('../config/database');

class TemplateController {
  static async getAllTemplates(req, res) {
    try {
      const [templates] = await db.execute(`
        SELECT * FROM Templates 
        WHERE isActive = TRUE 
        ORDER BY templateType ASC, templateName ASC
      `);
      res.json({ success: true, data: templates });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createTemplate(req, res) {
    try {
      const { templateName, templateType, duration } = req.body;
      
      const [result] = await db.execute(`
        INSERT INTO Templates (templateName, templateType, duration) 
        VALUES (?, ?, ?)
      `, [templateName, templateType, duration]);

      res.status(201).json({
        success: true,
        templateID: result.insertId,
        message: 'Template oluşturuldu'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { templateName, templateType, duration, isActive } = req.body;

      const [result] = await db.execute(`
        UPDATE Templates 
        SET templateName = ?, templateType = ?, duration = ?, isActive = ?
        WHERE templateID = ?
      `, [templateName, templateType, duration, isActive, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Template bulunamadı' });
      }

      res.json({ success: true, message: 'Template güncellendi' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

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
}

module.exports = TemplateController;