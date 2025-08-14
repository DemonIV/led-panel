const db = require('../config/database');

class MagazaModel {
  static async getAll() {
    const [rows] = await db.execute(`
      SELECT 
        m.*,
        COUNT(l.ledID) as ledSayisi,
        GROUP_CONCAT(DISTINCT l.tip) as ledTipleri
      FROM Magazalar m 
      LEFT JOIN Ledler l ON m.magazaID = l.magazaID 
      GROUP BY m.magazaID 
      ORDER BY m.createdAt DESC
    `);
    return rows;
  }

  static async create(magazaData) {
    const { sehir, magazaAdi } = magazaData;
    const [result] = await db.execute(
      'INSERT INTO Magazalar (sehir, magazaAdi) VALUES (?, ?)',
      [sehir, magazaAdi]
    );
    return result;
  }

  static async update(id, magazaData) {
    const { sehir, magazaAdi } = magazaData;
    const [result] = await db.execute(
      'UPDATE Magazalar SET sehir = ?, magazaAdi = ?, updatedAt = CURRENT_TIMESTAMP WHERE magazaID = ?',
      [sehir, magazaAdi, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM Magazalar WHERE magazaID = ?', [id]);
    return result;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM Magazalar WHERE magazaID = ?', 
      [id]
    );
    return rows[0];
  }

  static async getLedCount(magazaID) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM Ledler WHERE magazaID = ?', 
      [magazaID]
    );
    return rows[0].count;
  }

  static async getLedsByMagazaId(magazaID) {
    const [rows] = await db.execute(
      'SELECT * FROM Ledler WHERE magazaID = ? ORDER BY createdAt DESC', 
      [magazaID]
    );
    return rows;
  }

  // Şehir listesi (benzersiz)
  static async getUniqueCities() {
    const [rows] = await db.execute(
      'SELECT DISTINCT sehir FROM Magazalar ORDER BY sehir'
    );
    return rows.map(row => row.sehir);
  }
}

module.exports = MagazaModel;