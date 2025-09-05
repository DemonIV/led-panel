const ProjectModel = require('../models/projectModel');

const getAllProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.getAll();
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const result = await ProjectModel.create(req.body);
    res.status(201).json({ 
      success: true,
      projectID: result.insertId, 
      message: 'Proje oluşturuldu' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ProjectModel.update(id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }
    res.json({ success: true, message: 'Proje güncellendi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ProjectModel.delete(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }
    res.json({ success: true, message: 'Proje silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProjectAssets = async (req, res) => {
  try {
    const { id } = req.params;
    const assets = await ProjectModel.getAssets(id);
    res.json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getAllProjects, 
  createProject, 
  updateProject, 
  deleteProject,
  getProjectAssets 
};