const db = require('../config/database');

class LedModel {
  static async getAll() {
    const [rows] = await db.execute(`
      SELECT l.*, m.magazaAdi, m.sehir 
      FROM Ledler l 
      LEFT JOIN Magazalar m ON l.magazaID = m.magazaID 
      ORDER BY l.createdAt DESC
    `);
    return rows;
  }

  static async create(ledData) {
    const { 
      ledKodu, 
      enPx, 
      boyPx, 
      masterTipi = null, 
      tip = null, 
      ozelDurum = 'Aktif', 
      notlar = null, 
      magazaID = null 
    } = ledData;
    
    const [result] = await db.execute(
      'INSERT INTO Ledler (ledKodu, enPx, boyPx, masterTipi, tip, ozelDurum, notlar, magazaID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [ledKodu, enPx, boyPx, masterTipi, tip, ozelDurum, notlar, magazaID]
    );
    return result;
  }

  static async update(id, ledData) {
    const { 
      ledKodu, 
      enPx, 
      boyPx, 
      masterTipi = null, 
      tip = null, 
      ozelDurum = 'Aktif', 
      notlar = null, 
      magazaID = null 
    } = ledData;
    
    const [result] = await db.execute(
      'UPDATE Ledler SET ledKodu = ?, enPx = ?, boyPx = ?, masterTipi = ?, tip = ?, ozelDurum = ?, notlar = ?, magazaID = ?, updatedAt = CURRENT_TIMESTAMP WHERE ledID = ?',
      [ledKodu, enPx, boyPx, masterTipi, tip, ozelDurum, notlar, magazaID, id]
    );
    return result;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM Ledler WHERE ledID = ?', [id]);
    return result;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM Ledler WHERE ledID = ?', [id]);
    return rows[0];
  }
}

module.exports = LedModel;