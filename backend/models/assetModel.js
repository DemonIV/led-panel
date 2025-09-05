const db = require('../config/database');

class AssetModel {
  static async create(assetData) {
    const { assetName, assetType, filePath, fileSize, projectID } = assetData;
    const [result] = await db.execute(
      'INSERT INTO Assets (assetName, assetType, filePath, fileSize, projectID) VALUES (?, ?, ?, ?, ?)',
      [assetName, assetType, filePath, fileSize, projectID]
    );
    return result;
  }

  static async getByProject(projectId) {
    const [rows] = await db.execute(
      'SELECT * FROM Assets WHERE projectID = ? ORDER BY createdAt DESC',
      [projectId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM Assets WHERE assetID = ?',
      [id]
    );
    return rows[0];
  }

  static async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM Assets WHERE assetID = ?',
      [id]
    );
    return result;
  }

  static async getAll() {
    const [rows] = await db.execute(`
      SELECT 
        a.*,
        p.projectName,
        p.projectType
      FROM Assets a
      LEFT JOIN Projects p ON a.projectID = p.projectID
      ORDER BY a.createdAt DESC
    `);
    return rows;
  }
}

module.exports = AssetModel;