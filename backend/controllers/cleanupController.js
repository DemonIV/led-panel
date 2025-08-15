// backend/controllers/cleanupController.js - TAMAMLANMIŞ VERSİYON
const db = require('../config/database');

class CleanupController {
  // ✅ Cleanup istatistikleri (routes'ta kullanılıyor)
  static async getCleanupStats(req, res) {
    try {
      const [duplicateStats] = await db.execute(`
        SELECT 
          COUNT(*) as toplamKayit,
          COUNT(DISTINCT ledKodu) as benzersizLedKodu,
          (COUNT(*) - COUNT(DISTINCT ledKodu)) as duplicateKayitSayisi,
          (SELECT COUNT(*) FROM (
            SELECT ledKodu 
            FROM Ledler 
            GROUP BY ledKodu 
            HAVING COUNT(*) > 1
          ) as dup) as duplicateGrupSayisi
        FROM Ledler
      `);

      const [recentDuplicates] = await db.execute(`
        SELECT 
          ledKodu,
          COUNT(*) as kayitSayisi,
          GROUP_CONCAT(CONCAT(enPx, 'x', boyPx) ORDER BY (enPx * boyPx) DESC) as boyutlar
        FROM Ledler 
        GROUP BY ledKodu 
        HAVING COUNT(*) > 1
        ORDER BY kayitSayisi DESC
        LIMIT 5
      `);

      res.json({
        success: true,
        stats: duplicateStats[0],
        recentDuplicates
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Duplicate analizi
  static async analyzeDuplicates(req, res) {
    try {
      console.log('🔍 Duplicate analizi başlatılıyor...');

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

      console.log(`📊 ${duplicates.length} duplicate grup, ${toplamDuplicate} fazla kayıt bulundu`);

      res.json({
        success: true,
        duplicates,
        summary: {
          duplicateGroups: duplicates.length,
          totalDuplicateRecords: toplamDuplicate
        }
      });
    } catch (error) {
      console.error('❌ Duplicate analiz hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Otomatik temizlik (büyük boyutları sil)
  static async cleanupDuplicates(req, res) {
    try {
      const { dryRun = 'false' } = req.query; // Query'den al
      const isDryRun = dryRun === 'true';
      
      console.log(`🧹 ${isDryRun ? 'Test modu' : 'Gerçek'} temizlik başlatılıyor...`);

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
            keptRecord: `${Math.sqrt(group.minArea).toFixed(0)}px² (en küçük)`,
            deletedRecords: toDelete.map(item => ({
              ledID: item.ledID,
              boyut: `${item.enPx}x${item.boyPx}`,
              alan: item.alan,
              tip: item.tip
            }))
          });

          if (!isDryRun) {
            // Gerçekten sil
            const idsToDelete = toDelete.map(item => item.ledID);
            const placeholders = idsToDelete.map(() => '?').join(',');
            await db.execute(
              `DELETE FROM Ledler WHERE ledID IN (${placeholders})`,
              idsToDelete
            );
            totalDeleted += toDelete.length;
          }
        }
      }

      const responseData = {
        success: true,
        dryRun: isDryRun,
        summary: {
          duplicateGroupsFound: duplicateGroups.length,
          recordsDeleted: isDryRun ? 0 : totalDeleted,
          wouldBeDeleted: isDryRun ? deletionLog.reduce((sum, group) => sum + group.deletedRecords.length, 0) : totalDeleted
        },
        deletionLog
      };

      console.log(`✅ Temizlik tamamlandı: ${isDryRun ? 'Test' : totalDeleted + ' kayıt silindi'}`);
      res.json(responseData);
    } catch (error) {
      console.error('❌ Cleanup hatası:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CleanupController;