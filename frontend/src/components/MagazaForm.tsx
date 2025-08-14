import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Stack
} from '@mui/material';
import { Magaza } from '../types/magaza.types';
import { magazaAPI } from '../services/api';

interface MagazaFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMagaza?: Magaza | null;
}

const MagazaForm: React.FC<MagazaFormProps> = ({ open, onClose, onSuccess, editMagaza }) => {
  const [formData, setFormData] = useState<Partial<Magaza>>({
    sehir: '',
    magazaAdi: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editMagaza) {
      setFormData({
        sehir: editMagaza.sehir,
        magazaAdi: editMagaza.magazaAdi
      });
    } else {
      setFormData({
        sehir: '',
        magazaAdi: ''
      });
    }
    setError('');
  }, [editMagaza, open]);

  const handleChange = (field: keyof Magaza) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.sehir || !formData.magazaAdi) {
        throw new Error('Şehir ve Mağaza Adı alanları zorunludur');
      }

      if (editMagaza) {
        await magazaAPI.update(editMagaza.magazaID!, formData);
      } else {
        await magazaAPI.create(formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editMagaza ? 'Mağaza Düzenle' : 'Yeni Mağaza Ekle'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Şehir *"
              value={formData.sehir}
              onChange={handleChange('sehir')}
              placeholder="İstanbul, Ankara, İzmir..."
              required
            />

            <TextField
              fullWidth
              label="Mağaza Adı *"
              value={formData.magazaAdi}
              onChange={handleChange('magazaAdi')}
              placeholder="Mağaza adını giriniz"
              required
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
            {loading ? 'Kaydediliyor...' : editMagaza ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MagazaForm;