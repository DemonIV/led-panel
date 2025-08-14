const MagazaModel = require('../models/magazaModel');

const getAllMagazalar = async (req, res) => {
  try {
    const magazalar = await MagazaModel.getAll();
    res.json(magazalar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createMagaza = async (req, res) => {
  try {
    const result = await MagazaModel.create(req.body);
    res.status(201).json({ id: result.insertId, message: 'Mağaza başarıyla oluşturuldu' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMagaza = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await MagazaModel.update(id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Mağaza bulunamadı' });
    }
    res.json({ message: 'Mağaza başarıyla güncellendi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMagaza = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Önce bu mağazaya ait LED'lerin sayısını kontrol et
    const ledCount = await MagazaModel.getLedCount(id);
    if (ledCount > 0) {
      return res.status(400).json({ 
        error: `Bu mağazaya atanmış ${ledCount} adet LED bulunmaktadır. Önce LED'leri başka mağazaya taşıyın.` 
      });
    }

    const result = await MagazaModel.delete(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Mağaza bulunamadı' });
    }
    res.json({ message: 'Mağaza başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMagazaWithLeds = async (req, res) => {
  try {
    const { id } = req.params;
    const magaza = await MagazaModel.findById(id);
    if (!magaza) {
      return res.status(404).json({ error: 'Mağaza bulunamadı' });
    }
    
    const leds = await MagazaModel.getLedsByMagazaId(id);
    res.json({ ...magaza, leds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getAllMagazalar, 
  createMagaza, 
  updateMagaza, 
  deleteMagaza, 
  getMagazaWithLeds 
};