const ProjectModel = require('../models/projectModel');

class ProjectController {
  static async getAllProjects(req, res) {
    try {
      const projects = await ProjectModel.getAll();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createProject(req, res) {
    try {
      const result = await ProjectModel.create(req.body);
      res.status(201).json({ 
        projectID: result.insertId, 
        message: 'Proje oluşturuldu' 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProject(req, res) {
    try {
      const { id } = req.params;
      const result = await ProjectModel.update(id, req.body);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Proje bulunamadı' });
      }
      res.json({ message: 'Proje güncellendi' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const result = await ProjectModel.delete(id);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Proje bulunamadı' });
      }
      res.json({ message: 'Proje silindi' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getProjectAssets(req, res) {
    try {
      const { id } = req.params;
      const assets = await ProjectModel.getAssets(id);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = { 
  getAllProjects: ProjectController.getAllProjects,
  createProject: ProjectController.createProject,
  updateProject: ProjectController.updateProject,
  deleteProject: ProjectController.deleteProject,
  getProjectAssets: ProjectController.getProjectAssets
};