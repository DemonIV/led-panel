const db = require('../config/database');

class RenderQueueController {
  // Render kuyruğunu getir
  static async getRenderQueue(req, res) {
    try {
      const { status } = req.query;
      
      let whereClause = '';
      let params = [];
      
      if (status) {
        whereClause = 'WHERE rq.status = ?';
        params.push(status);
      }
      
      const [queue] = await db.execute(`
        SELECT 
          rq.*,
          p.projectName,
          p.projectType,
          t.templateName,
          u.username as createdByName
        FROM RenderQueue rq
        LEFT JOIN Projects p ON rq.projectID = p.projectID
        LEFT JOIN Templates t ON rq.templateID = t.templateID
        LEFT JOIN Users u ON rq.createdBy = u.userID
        ${whereClause}
        ORDER BY rq.createdAt DESC
      `, params);
      
      res.json({ success: true, data: queue });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Render işi ekle
  static async addToQueue(req, res) {
    try {
      const { 
        projectID, 
        templateID, 
        outputPath, 
        renderSettings,
        estimatedTime 
      } = req.body;
      
      const [result] = await db.execute(`
        INSERT INTO RenderQueue (
          projectID, 
          templateID, 
          outputPath, 
          renderSettings,
          estimatedTime,
          createdBy
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        projectID, 
        templateID, 
        outputPath, 
        JSON.stringify(renderSettings),
        estimatedTime,
        req.user.userID
      ]);

      res.status(201).json({
        success: true,
        queueID: result.insertId,
        message: 'Render kuyruğuna eklendi'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Render durumunu güncelle
  static async updateRenderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, progress, errorMessage, actualTime } = req.body;
      
      let updateFields = ['status = ?'];
      let params = [status];
      
      if (progress !== undefined) {
        updateFields.push('progress = ?');
        params.push(progress);
      }
      
      if (status === 'processing' && !req.body.startedAt) {
        updateFields.push('startedAt = NOW()');
      }
      
      if (status === 'completed' || status === 'failed') {
        updateFields.push('completedAt = NOW()');
        if (actualTime) {
          updateFields.push('actualTime = ?');
          params.push(actualTime);
        }
      }
      
      if (errorMessage) {
        updateFields.push('errorMessage = ?');
        params.push(errorMessage);
      }
      
      params.push(id);
      
      const [result] = await db.execute(`
        UPDATE RenderQueue 
        SET ${updateFields.join(', ')}
        WHERE queueID = ?
      `, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Render işi bulunamadı' });
      }

      res.json({ success: true, message: 'Render durumu güncellendi' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Render işini sil
  static async deleteFromQueue(req, res) {
    try {
      const { id } = req.params;
      
      const [result] = await db.execute(`
        DELETE FROM RenderQueue WHERE queueID = ?
      `, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Render işi bulunamadı' });
      }

      res.json({ success: true, message: 'Render işi silindi' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Render istatistikleri
  static async getRenderStats(req, res) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as totalJobs,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingJobs,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processingJobs,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedJobs,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedJobs,
          AVG(CASE WHEN actualTime > 0 THEN actualTime END) as avgRenderTime,
          SUM(CASE WHEN actualTime > 0 THEN actualTime END) as totalRenderTime
        FROM RenderQueue
        WHERE DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `);

      const [recentJobs] = await db.execute(`
        SELECT 
          rq.queueID,
          rq.status,
          rq.progress,
          p.projectName,
          rq.createdAt
        FROM RenderQueue rq
        LEFT JOIN Projects p ON rq.projectID = p.projectID
        ORDER BY rq.createdAt DESC
        LIMIT 10
      `);

      res.json({ 
        success: true, 
        stats: stats[0],
        recentJobs: recentJobs
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // After Effects için - bir sonraki render işini al
  static async getNextJob(req, res) {
    try {
      const [jobs] = await db.execute(`
        SELECT 
          rq.*,
          p.projectName,
          p.projectType,
          t.templateName,
          t.templatePath,
          t.defaultSettings
        FROM RenderQueue rq
        LEFT JOIN Projects p ON rq.projectID = p.projectID
        LEFT JOIN Templates t ON rq.templateID = t.templateID
        WHERE rq.status = 'pending'
        ORDER BY rq.createdAt ASC
        LIMIT 1
      `);

      if (jobs.length === 0) {
        return res.json({ success: true, data: null, message: 'Kuyrukta iş yok' });
      }

      // İşi processing olarak işaretle
      await db.execute(`
        UPDATE RenderQueue 
        SET status = 'processing', startedAt = NOW()
        WHERE queueID = ?
      `, [jobs[0].queueID]);

      res.json({ success: true, data: jobs[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = RenderQueueController;