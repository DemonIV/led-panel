const LedModel = require('../models/ledModel');
const fs = require('fs'); // ✅ Dosyanın başına ekle
const csv = require('csv-parser'); // ✅ Dosyanın başına ekle

// LED'leri getir
const getAllLeds = async (req, res) => {
  try {
    const leds = await LedModel.getAll();
    res.json(leds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createLed = async (req, res) => {
  try {
    const result = await LedModel.create(req.body);
    res.status(201).json({ id: result.insertId, message: 'LED created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateLed = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await LedModel.update(id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'LED not found' });
    }
    res.json({ message: 'LED updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteLed = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await LedModel.delete(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'LED not found' });
    }
    res.json({ message: 'LED deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const importCSV = async (req, res) => {
  try {
    console.log('📁 CSV Import başlatıldı:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: 'CSV dosyası gerekli' });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        console.log('📊 CSV satırı:', row);
        
        if (row.ledKodu && row.enPx && row.boyPx) {
          results.push({
            ledKodu: row.ledKodu.trim(),
            enPx: parseInt(row.enPx),
            boyPx: parseInt(row.boyPx),
            tip: row.tip?.trim() || null,
            ozelDurum: row.ozelDurum?.trim() || 'Aktif',
            notlar: row.notlar?.trim() || null,
            magazaID: row.magazaID ? parseInt(row.magazaID) : null
          });
        } else {
          errors.push(`Eksik veri: ${JSON.stringify(row)}`);
        }
      })
      .on('end', async () => {
        console.log('📈 Toplam satır:', results.length);
        
        let successCount = 0;
        for (const ledData of results) {
          try {
            await LedModel.create(ledData);
            successCount++;
            console.log('✅ Eklendi:', ledData.ledKodu);
          } catch (error) {
            console.error('❌ Hata:', ledData.ledKodu, error.message);
            errors.push(`${ledData.ledKodu}: ${error.message}`);
          }
        }

        // Temp dosyayı sil
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.json({
          success: true,
          imported: successCount,
          total: results.length,
          errors: errors
        });
      })
      .on('error', (error) => {
        console.error('❌ CSV okuma hatası:', error);
        res.status(500).json({ error: 'CSV dosyası okunamadı' });
      });
  } catch (error) {
    console.error('❌ Import hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllLeds, createLed, updateLed, deleteLed , importCSV};