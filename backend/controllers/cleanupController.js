// backend/controllers/cleanupController.js (YENİ DOSYA)
const db = require('../config/database');

class CleanupController {
  // Duplicate analizi
  static async analyzeDuplicates(req, res) {
    try {
      const [duplicates] = await db.execute(`
        SELECT 
          ledKodu,
          COUNT(*) as kayitSayisi,
          GROUP_CONCAT(CONCAT(enPx, 'x', boyPx, ' (ID:', ledID, ')') ORDER BY (enPx * boyPx) DESC) as boyutlar,
          MIN(enPx * boyPx) as enKucukAlan,
          MAX(enPx * boyPx) as enBuyukAlan
        FROM Ledler 
        GROUP BY ledKodu 
        HAVING COUNT(*) > 1
        ORDER BY kayitSayisi DESC
      `);

      const toplamDuplicate = duplicates.reduce((sum, item) => sum + (item.kayitSayisi - 1), 0);

      res.json({
        success: true,
        duplicates,
        summary: {
          duplicateGroups: duplicates.length,
          totalDuplicateRecords: toplamDuplicate
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Otomatik temizlik (büyük boyutları sil)
  static async cleanupDuplicates(req, res) {
    try {
      const { dryRun = false } = req.query; // Test modunda çalıştırma

      // Aynı LED kodu olan kayıtları bul
      const [duplicateGroups] = await db.execute(`
        SELECT ledKodu, MIN(enPx * boyPx) as minArea
        FROM Ledler 
        GROUP BY ledKodu 
        HAVING COUNT(*) > 1
      `);

      let totalDeleted = 0;
      const deletionLog = [];

      for (const group of duplicateGroups) {
        // Bu LED kodu için en küçük alan hariç diğerlerini bul
        const [toDelete] = await db.execute(`
          SELECT ledID, enPx, boyPx, (enPx * boyPx) as alan, tip, magazaID
          FROM Ledler 
          WHERE ledKodu = ? AND (enPx * boyPx) > ?
          ORDER BY (enPx * boyPx) DESC
        `, [group.ledKodu, group.minArea]);

        if (toDelete.length > 0) {
          deletionLog.push({
            ledKodu: group.ledKodu,
            keptRecord: `${Math.sqrt(group.minArea)}px (en küçük)`,
            deletedRecords: toDelete.map(item => ({
              ledID: item.ledID,
              boyut: `${item.enPx}x${item.boyPx}`,
              alan: item.alan,
              tip: item.tip
            }))
          });

          if (!dryRun) {
            // Gerçekten sil
            const idsToDelete = toDelete.map(item => item.ledID);
            await db.execute(
              `DELETE FROM Ledler WHERE ledID IN (${idsToDelete.map(() => '?').join(',')})`,
              idsToDelete
            );
            totalDeleted += toDelete.length;
          }
        }
      }

      res.json({
        success: true,
        dryRun,
        summary: {
          duplicateGroupsFound: duplicateGroups.length,
          recordsDeleted: dryRun ? 0 : totalDeleted,
          wouldBeDeleted: dryRun ? deletionLog.reduce((sum, group) => sum + group.deletedRecords.length, 0) : totalDeleted
        },
        deletionLog
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CleanupController;