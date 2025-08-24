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
    const [rows] = await db.execute('SELECT * FROM Assets WHERE projectID = ?', [projectId]);
    return rows;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM Assets WHERE assetID = ?', [id]);
    return result;
  }
}

module.exports = AssetModel;