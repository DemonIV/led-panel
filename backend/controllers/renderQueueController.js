// backend/controllers/renderQueueController.js
const mysql = require('mysql2/promise');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'led_panel_db'
});

class RenderQueueController {
  
  // ✅ Tüm render işlerini getir
  static async getAllJobs(req, res) {
    try {
      const [jobs] = await db.execute(`
        SELECT rq.*, p.projectName, p.projectType,
               COUNT(a.assetID) as assetCount
        FROM RenderQueue rq
        LEFT JOIN Projects p ON rq.projectID = p.projectID
        LEFT JOIN Assets a ON rq.projectID = a.projectID
        GROUP BY rq.jobID
        ORDER BY rq.createdAt DESC
      `);
      
      res.json({ success: true, jobs });
    } catch (error) {
      console.error('❌ Render jobs getirme hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Bekleyen işleri getir (AE plugin için)
  static async getPendingJobs(req, res) {
    try {
      const [jobs] = await db.execute(`
        SELECT rq.*, p.projectName, p.projectType,
               GROUP_CONCAT(a.filePath) as assetPaths,
               GROUP_CONCAT(a.assetType) as assetTypes
        FROM RenderQueue rq
        LEFT JOIN Projects p ON rq.projectID = p.projectID
        LEFT JOIN Assets a ON rq.projectID = a.projectID
        WHERE rq.status = 'pending'
        GROUP BY rq.jobID
        ORDER BY rq.priority DESC, rq.createdAt ASC
        LIMIT 10
      `);
      
      // Asset bilgilerini parse et
      const formattedJobs = jobs.map(job => ({
        ...job,
        assets: job.assetPaths ? job.assetPaths.split(',').map((path, index) => ({
          filePath: path,
          assetType: job.assetTypes.split(',')[index]
        })) : []
      }));
      
      res.json({ success: true, jobs: formattedJobs });
    } catch (error) {
      console.error('❌ Pending jobs getirme hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Yeni render işi oluştur
  static async createRenderJob(req, res) {
    try {
      const { 
        projectID, 
        jobName, 
        renderType = 'composition',
        outputPath,
        settings = {},
        priority = 1
      } = req.body;
      
      if (!projectID || !jobName) {
        return res.status(400).json({ error: 'Project ID ve job name gerekli' });
      }
      
      const [result] = await db.execute(`
        INSERT INTO RenderQueue 
        (projectID, jobName, renderType, outputPath, settings, priority, status, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
      `, [
        projectID,
        jobName,
        renderType,
        outputPath,
        JSON.stringify(settings),
        priority
      ]);
      
      console.log(`✅ Render job oluşturuldu: ${jobName} (ID: ${result.insertId})`);
      
      res.json({
        success: true,
        jobID: result.insertId,
        message: 'Render job oluşturuldu'
      });
      
    } catch (error) {
      console.error('❌ Render job oluşturma hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ AE Kompozisyon oluşturma (Plugin için özel)
  static async createAEComposition(req, res) {
    try {
      const {
        projectID,
        compositionName,
        width = 1920,
        height = 1080,
        frameRate = 30,
        duration = 10,
        backgroundColor = [0, 0, 0],
        assets = [],
        templates = []
      } = req.body;

      if (!projectID || !compositionName) {
        return res.status(400).json({ error: 'Project ID ve composition name gerekli' });
      }

      // AE Script komutları oluştur
      const aeCommands = {
        type: 'create_composition',
        composition: {
          name: compositionName,
          width: width,
          height: height,
          frameRate: frameRate,
          duration: duration,
          backgroundColor: backgroundColor
        },
        assets: assets,
        templates: templates,
        projectID: projectID
      };

      // Render job olarak kaydet
      const [result] = await db.execute(`
        INSERT INTO RenderQueue 
        (projectID, jobName, renderType, settings, status, priority, createdAt) 
        VALUES (?, ?, 'ae_composition', ?, 'pending', 2, NOW())
      `, [
        projectID,
        compositionName,
        JSON.stringify(aeCommands)
      ]);

      console.log(`✅ AE Composition job oluşturuldu: ${compositionName}`);

      res.json({
        success: true,
        jobID: result.insertId,
        aeCommands: aeCommands,
        message: 'After Effects composition job oluşturuldu'
      });

    } catch (error) {
      console.error('❌ AE composition oluşturma hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Toplu job oluşturma
  static async createBatchJobs(req, res) {
    try {
      const { jobs } = req.body;
      
      if (!jobs || !Array.isArray(jobs)) {
        return res.status(400).json({ error: 'Jobs array gerekli' });
      }
      
      const createdJobs = [];
      
      for (const job of jobs) {
        const [result] = await db.execute(`
          INSERT INTO RenderQueue 
          (projectID, jobName, renderType, outputPath, settings, priority, status, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        `, [
          job.projectID,
          job.jobName,
          job.renderType || 'composition',
          job.outputPath,
          JSON.stringify(job.settings || {}),
          job.priority || 1
        ]);
        
        createdJobs.push({
          jobID: result.insertId,
          jobName: job.jobName
        });
      }
      
      console.log(`✅ Toplu job oluşturuldu: ${createdJobs.length} iş`);
      
      res.json({
        success: true,
        createdJobs: createdJobs,
        count: createdJobs.length
      });
      
    } catch (error) {
      console.error('❌ Batch job oluşturma hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Job status güncelleme
  static async updateJobStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, progress = 0, errorMessage = null } = req.body;
      
      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Geçersiz status' });
      }
      
      const updateFields = ['status = ?', 'progress = ?', 'updatedAt = NOW()'];
      const values = [status, progress];
      
      if (status === 'completed') {
        updateFields.push('completedAt = NOW()');
      }
      
      if (errorMessage) {
        updateFields.push('errorMessage = ?');
        values.push(errorMessage);
      }
      
      values.push(id);
      
      await db.execute(`
        UPDATE RenderQueue 
        SET ${updateFields.join(', ')}
        WHERE jobID = ?
      `, values);
      
      console.log(`✅ Job status güncellendi: ${id} -> ${status} (${progress}%)`);
      
      res.json({
        success: true,
        message: 'Job status güncellendi'
      });
      
    } catch (error) {
      console.error('❌ Job status güncelleme hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Job silme
  static async deleteJob(req, res) {
    try {
      const { id } = req.params;
      
      await db.execute('DELETE FROM RenderQueue WHERE jobID = ?', [id]);
      
      console.log(`✅ Job silindi: ${id}`);
      
      res.json({
        success: true,
        message: 'Job silindi'
      });
      
    } catch (error) {
      console.error('❌ Job silme hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Job status sorgulama
  static async getJobStatus(req, res) {
    try {
      const { id } = req.params;
      
      const [jobs] = await db.execute(`
        SELECT rq.*, p.projectName 
        FROM RenderQueue rq
        LEFT JOIN Projects p ON rq.projectID = p.projectID
        WHERE rq.jobID = ?
      `, [id]);
      
      if (jobs.length === 0) {
        return res.status(404).json({ error: 'Job bulunamadı' });
      }
      
      const job = jobs[0];
      job.settings = job.settings ? JSON.parse(job.settings) : {};
      
      res.json({ success: true, job });
      
    } catch (error) {
      console.error('❌ Job status sorgulama hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Render istatistikleri
  static async getRenderStats(req, res) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as totalJobs,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingJobs,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processingJobs,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedJobs,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedJobs,
          AVG(CASE WHEN status = 'completed' AND completedAt IS NOT NULL 
              THEN TIMESTAMPDIFF(MINUTE, createdAt, completedAt) END) as avgCompletionMinutes,
          COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as jobsLast24h
        FROM RenderQueue
      `);
      
      const renderStats = stats[0];
      
      res.json({
        success: true,
        stats: {
          total: renderStats.totalJobs,
          pending: renderStats.pendingJobs,
          processing: renderStats.processingJobs,
          completed: renderStats.completedJobs,
          failed: renderStats.failedJobs,
          averageCompletionTime: Math.round(renderStats.avgCompletionMinutes || 0),
          jobsLast24Hours: renderStats.jobsLast24h
        }
      });
      
    } catch (error) {
      console.error('❌ Render stats hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = RenderQueueController;