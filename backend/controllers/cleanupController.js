const db = require('../config/database');

class CleanupController {
  static async getCleanupStats(req, res) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as toplamKayit,
          COUNT(DISTINCT ledKodu) as benzersizLedKodu,
          (COUNT(*) - COUNT(DISTINCT ledKodu)) as duplicateKayitSayisi,
          (SELECT COUNT(*) FROM (
            SELECT ledKodu FROM Ledler 
            GROUP BY ledKodu 
            HAVING COUNT(*) > 1
          ) as duplicates) as duplicateGrupSayisi
        FROM Ledler
      `);

      res.json({
        success: true,
        stats: stats[0]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async analyzeDuplicates(req, res) {
    try {
      const [duplicates] = await db.execute(`
        SELECT 
          ledKodu,
          COUNT(*) as kayitSayisi,
          GROUP_CONCAT(CONCAT(enPx, 'x', boyPx) ORDER BY (enPx * boyPx)) as boyutlar,
          MIN(enPx * boyPx) as enKucukAlan,
          MAX(enPx * boyPx) as enBuyukAlan
        FROM Ledler 
        GROUP BY ledKodu 
        HAVING COUNT(*) > 1
        ORDER BY kayitSayisi DESC
      `);

      res.json({
        success: true,
        duplicates: duplicates
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async cleanupDuplicates(req, res) {
    try {
      const { dryRun = true } = req.query;
      const deletionLog = [];

      // Duplicate grupları bul
      const [duplicateGroups] = await db.execute(`
        SELECT ledKodu, COUNT(*) as count
        FROM Ledler 
        GROUP BY ledKodu 
        HAVING COUNT(*) > 1
      `);

      for (const group of duplicateGroups) {
        // Her grup için kayıtları al (küçükten büyüğe sıralı)
        const [records] = await db.execute(`
          SELECT ledID, ledKodu, enPx, boyPx, (enPx * boyPx) as alan, tip
          FROM Ledler 
          WHERE ledKodu = ?
          ORDER BY (enPx * boyPx) ASC
        `, [group.ledKodu]);

        if (records.length > 1) {
          // En küçük alanı tut, diğerlerini sil
          const keptRecord = records[0];
          const deletedRecords = records.slice(1);

          deletionLog.push({
            ledKodu: group.ledKodu,
            keptRecord: `${keptRecord.enPx}x${keptRecord.boyPx} (${keptRecord.alan} px²)`,
            deletedRecords: deletedRecords.map(r => ({
              ledID: r.ledID,
              boyut: `${r.enPx}x${r.boyPx}`,
              alan: r.alan,
              tip: r.tip
            }))
          });

          // Gerçek silme işlemi (dryRun false ise)
          if (dryRun === 'false') {
            const idsToDelete = deletedRecords.map(r => r.ledID);
            await db.execute(`
              DELETE FROM Ledler WHERE ledID IN (${idsToDelete.map(() => '?').join(',')})
            `, idsToDelete);
          }
        }
      }

      res.json({
        success: true,
        dryRun: dryRun !== 'false',
        deletionLog: deletionLog,
        summary: {
          duplicateGroups: duplicateGroups.length,
          recordsToDelete: deletionLog.reduce((sum, log) => sum + log.deletedRecords.length, 0),
          recordsDeleted: dryRun === 'false' ? deletionLog.reduce((sum, log) => sum + log.deletedRecords.length, 0) : 0
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CleanupController;