const db = require('../config/database');

class ProjectModel {
  static async getAll() {
    const [rows] = await db.execute(`
      SELECT 
        p.*,
        COUNT(a.assetID) as assetCount
      FROM Projects p 
      LEFT JOIN Assets a ON p.projectID = a.projectID 
      GROUP BY p.projectID 
      ORDER BY p.createdAt DESC
    `);
    return rows;
  }

  static async create(projectData) {
    const { projectName, projectType, description } = projectData;
    const [result] = await db.execute(
      'INSERT INTO Projects (projectName, projectType, description) VALUES (?, ?, ?)',
      [projectName, projectType, description]
    );
    return result;
  }

  static async update(id, projectData) {
    const { projectName, projectType, description, status } = projectData;
    const [result] = await db.execute(
      'UPDATE Projects SET projectName = ?, projectType = ?, description = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE projectID = ?',
      [projectName, projectType, description, status, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM Projects WHERE projectID = ?', [id]);
    return result;
  }

  static async getAssets(projectId) {
    const [rows] = await db.execute(
      'SELECT * FROM Assets WHERE projectID = ? ORDER BY createdAt DESC',
      [projectId]
    );
    return rows;
  }
}

module.exports = ProjectModel;