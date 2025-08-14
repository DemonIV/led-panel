import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Stack
} from '@mui/material';
import { LED } from '../types/led.types';
import { Magaza } from '../types/magaza.types';
import { ledAPI, magazaAPI } from '../services/api';

interface LEDFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editLed?: LED | null;
}

const LEDForm: React.FC<LEDFormProps> = ({ open, onClose, onSuccess, editLed }) => {
  const [formData, setFormData] = useState<Partial<LED>>({
    ledKodu: '',
    enPx: 0,
    boyPx: 0,
    masterTipi: '',
    tip: '',
    ozelDurum: 'Aktif',
    notlar: '',
    magazaID: undefined
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magazalar, setMagazalar] = useState<Magaza[]>([]); // YENİ

  const durumSecenekleri = ['Aktif', 'Pasif', 'Bakım', 'Test'];
  const masterTipSecenekleri = ['Yatay', 'Dikey', 'Kare', 'Uzun'];

// Mağaza listesini getir
const fetchMagazalar = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Token bulunamadı, mağaza listesi getirilemez');
      return;
    }

    console.log('Mağaza listesi çekiliyor...'); 
    const response = await magazaAPI.getAll();
    console.log('Mağaza response:', response.data); 
    setMagazalar(response.data);
  } catch (error) {
    console.error('Mağaza listesi alınamadı:', error);
    // Token expired olabilir, ignore et
  }
};
  useEffect(() => {
    if (open) {
      fetchMagazalar(); // Form açıldığında mağazaları getir
    }
  }, [open]);

  useEffect(() => {
    if (editLed) {
      setFormData({
        ledKodu: editLed.ledKodu,
        enPx: editLed.enPx,
        boyPx: editLed.boyPx,
        masterTipi: editLed.masterTipi || '',
        tip: editLed.tip || '',
        ozelDurum: editLed.ozelDurum || 'Aktif',
        notlar: editLed.notlar || '',
        magazaID: editLed.magazaID || undefined
      });
    } else {
      setFormData({
        ledKodu: '',
        enPx: 0,
        boyPx: 0,
        masterTipi: '',
        tip: '',
        ozelDurum: 'Aktif',
        notlar: '',
        magazaID: undefined
      });
    }
    setError('');
  }, [editLed, open]);
  const handleChange = (field: keyof LED) => (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'enPx' || field === 'boyPx' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    if (!formData.ledKodu || !formData.enPx || !formData.boyPx) {
      throw new Error('LED Kodu, En ve Boy alanları zorunludur');
    }

    // Undefined değerleri null'a çevir
    const submitData = {
      ...formData,
      masterTipi: formData.masterTipi || null,
      tip: formData.tip || null,
      notlar: formData.notlar || null,
      magazaID: formData.magazaID || null
    };

    if (editLed) {
      await ledAPI.update(editLed.ledID!, submitData);
    } else {
      await ledAPI.create(submitData);
    }

    onSuccess();
    onClose();
  } catch (err: any) {
    setError(err.response?.data?.error || err.message || 'Bir hata oluştu');
  } finally {
    setLoading(false);
  }
};

  const calculateAspectRatio = () => {
    if (formData.enPx && formData.boyPx) {
      return (formData.enPx / formData.boyPx).toFixed(3);
    }
    return '0.000';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editLed ? 'LED Panel Düzenle' : 'Yeni LED Panel Ekle'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* İlk satır: LED Kodu ve Durum */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="LED Kodu *"
                value={formData.ledKodu}
                onChange={handleChange('ledKodu')}
                placeholder="LED001, LED002..."
                required
              />
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={formData.ozelDurum}
                  onChange={handleChange('ozelDurum')}
                  label="Durum"
                >
                  {durumSecenekleri.map(durum => (
                    <MenuItem key={durum} value={durum}>
                      {durum}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* İkinci satır: Boyutlar ve Aspect Ratio */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="En (px) *"
                type="number"
                value={formData.enPx || ''}
                onChange={handleChange('enPx')}
                required
                inputProps={{ min: 1 }}
              />
              <TextField
                fullWidth
                label="Boy (px) *"
                type="number"
                value={formData.boyPx || ''}
                onChange={handleChange('boyPx')}
                required
                inputProps={{ min: 1 }}
              />
              <TextField
                fullWidth
                label="Aspect Ratio"
                value={calculateAspectRatio()}
                disabled
                helperText="Otomatik hesaplanır"
              />
            </Box>

            {/* Üçüncü satır: Master Tipi ve Tip */}
        <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Master Tipi</InputLabel>
                <Select
                  value={formData.masterTipi}
                  onChange={handleChange('masterTipi')}
                  label="Master Tipi"
                >
                  {masterTipSecenekleri.map(tip => (
                    <MenuItem key={tip} value={tip}>
                      {tip}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tip"
                value={formData.tip}
                onChange={handleChange('tip')}
                placeholder="Otomatik hesaplanacak"
                helperText="Aspect ratio'ya göre otomatik belirlenecek"
              />
            </Box>

            {/* YENİ: Mağaza Seçimi */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Mağaza</InputLabel>
                <Select
                  value={formData.magazaID || ''}
                  onChange={handleChange('magazaID')}
                  label="Mağaza"
                >
                  <MenuItem value="">
                    <em>Mağaza Seçilmedi</em>
                  </MenuItem>
                  {magazalar.map(magaza => (
                    <MenuItem key={magaza.magazaID} value={magaza.magazaID}>
                      {magaza.sehir} - {magaza.magazaAdi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
                    
            {/* Notlar */}
            <TextField
              fullWidth
              label="Notlar"
              value={formData.notlar}
              onChange={handleChange('notlar')}
              multiline
              rows={3}
              placeholder="LED panel hakkında ek bilgiler..."
            />
            
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : editLed ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LEDForm;