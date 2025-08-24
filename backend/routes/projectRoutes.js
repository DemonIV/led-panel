const express = require('express');
const router = express.Router();
const { getAllProjects, createProject, updateProject, deleteProject, getProjectAssets } = require('../controllers/projectController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, getAllProjects);
router.post('/', authenticateToken, authorizeRoles('admin', 'ajans'), createProject);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'ajans'), updateProject);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteProject);
router.get('/:id/assets', authenticateToken, getProjectAssets);

module.exports = router;