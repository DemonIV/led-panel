const ProjectModel = require('../models/projectModel');

const getAllProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.getAll();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const result = await ProjectModel.create(req.body);
    res.status(201).json({ 
      projectID: result.insertId, 
      message: 'Proje başarıyla oluşturuldu' 
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
    res.json({ message: 'Proje güncellendi' });
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
    res.json({ message: 'Proje silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProjectAssets = async (req, res) => {
  try {
    const { id } = req.params;
    const assets = await ProjectModel.getAssets(id);
    res.json(assets);
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