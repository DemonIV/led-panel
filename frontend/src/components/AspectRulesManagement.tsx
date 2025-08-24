// frontend/src/components/AspectRulesManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Settings,
  Calculate
} from '@mui/icons-material';
import { AspectRule } from '../types/aspectRule.types';
import { aspectRulesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AspectRulesManagement: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AspectRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRule, setEditRule] = useState<AspectRule | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AspectRule | null>(null);
  const [recalculateLoading, setRecalculateLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // formData state'ini güncelleyin:
const [formData, setFormData] = useState<Partial<AspectRule>>({
  tipAdi: '',
  minRatio: 0,      // ✅ 0'dan başlasın
  maxRatio: 0.1,    // ✅ Küçük default değer
  masterWidth: 1920,
  masterHeight: 1920
});

  const canEdit = user?.role === 'admin' || user?.role === 'ajans';

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await aspectRulesAPI.getAll();
      setRules(response.data.data || []);
    } catch (error) {
      console.error('Aspect rules alınamadı:', error);
      setError('Kurallar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddNew = () => {
  setEditRule(null);
  setFormData({
    tipAdi: '',
    minRatio: 0,      // ✅ 0'dan başlasın
    maxRatio: 0.1,    // ✅ Küçük default değer  
    masterWidth: 1920,
    masterHeight: 1920
  });
  setFormOpen(true);
};

  const handleEdit = (rule: AspectRule) => {
    setEditRule(rule);
    setFormData(rule);
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      setError('');
      
      if (!formData.tipAdi || !formData.minRatio || !formData.maxRatio) {
        setError('Tüm alanları doldurun');
        return;
      }

      if (formData.minRatio >= formData.maxRatio) {
        setError('Minimum ratio maksimum ratio\'dan küçük olmalı');
        return;
      }

      if (editRule) {
        await aspectRulesAPI.update(editRule.ruleID!, formData);
        setSuccess('Kural güncellendi');
      } else {
        await aspectRulesAPI.create(formData);
        setSuccess('Yeni kural eklendi');
      }

      setFormOpen(false);
      fetchRules();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kural kaydedilemedi');
    }
  };

  const handleDeleteClick = (rule: AspectRule) => {
    setRuleToDelete(rule);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ruleToDelete) return;

    try {
      await aspectRulesAPI.delete(ruleToDelete.ruleID!);
      setDeleteConfirmOpen(false);
      setRuleToDelete(null);
      setSuccess('Kural silindi');
      fetchRules();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Kural silinemedi');
    }
  };

  const handleRecalculateAll = async () => {
    try {
      setRecalculateLoading(true);
      const response = await aspectRulesAPI.recalculateAll();
      setSuccess(`${response.data.updatedCount} LED panelin tipi yeniden hesaplandı`);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Yeniden hesaplama başarısız');
    } finally {
      setRecalculateLoading(false);
    }
  };

  const formatRatio = (ratio: number | string) => {
  const numRatio = typeof ratio === 'string' ? parseFloat(ratio) : ratio;
  return isNaN(numRatio) ? '0.000' : numRatio.toFixed(3);
};

  const getRatioDescription = (rule: AspectRule) => {
    if (rule.minRatio === 0 && rule.maxRatio <= 0.1) return '📱 Çok dar dikey';
    if (rule.minRatio >= 0.1 && rule.maxRatio <= 0.8) return '📱 Dikey';
    if (rule.minRatio >= 0.8 && rule.maxRatio <= 1.2) return '⬜ Kare';
    if (rule.minRatio >= 1.2 && rule.maxRatio <= 7) return '📺 Yatay';
    if (rule.maxRatio > 7) return '📏 Çok geniş yatay';
    return '❓ Özel';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Aspect kuralları yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık ve İşlemler */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Aspect Ratio Kuralları ⚖️
          </Typography>
          <Typography variant="body2" color="text.secondary">
            LED panellerin boyut oranlarına göre tip sınıflandırması
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton onClick={fetchRules} title="Yenile">
            <Refresh />
          </IconButton>
          
          {canEdit && (
            <>
              <Button
                variant="outlined"
                startIcon={recalculateLoading ? <CircularProgress size={20} /> : <Calculate />}
                onClick={handleRecalculateAll}
                disabled={recalculateLoading}
                color="warning"
              >
                {recalculateLoading ? 'Hesaplanıyor...' : 'Tüm LED\'leri Yeniden Sınıflandır'}
              </Button>
              
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={handleAddNew}
              >
                Yeni Kural Ekle
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Rules Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tip Adı</strong></TableCell>
                  <TableCell><strong>Ratio Aralığı</strong></TableCell>
                  <TableCell><strong>Açıklama</strong></TableCell>
                  <TableCell><strong>Master Boyutlar</strong></TableCell>
                  <TableCell><strong>Durum</strong></TableCell>
                  {canEdit && <TableCell><strong>İşlemler</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.ruleID} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {rule.tipAdi}
                      </Typography>
                    </TableCell>
                    
                   <TableCell>
  <Typography variant="body2">
    {formatRatio(rule.minRatio)} - {formatRatio(rule.maxRatio)}
  </Typography>
  <Typography variant="caption" color="text.secondary">
    ({formatRatio(rule.minRatio)} - {formatRatio(rule.maxRatio)})
  </Typography>
</TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {getRatioDescription(rule)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {rule.masterWidth} × {rule.masterHeight}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={rule.isActive ? 'Aktif' : 'Pasif'} 
                        color={rule.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    
                    {canEdit && (
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEdit(rule)}
                            title="Düzenle"
                          >
                            <Edit />
                          </IconButton>
                          
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(rule)}
                            title="Sil"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {rules.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Henüz aspect ratio kuralı tanımlanmamış
              </Typography>
              {canEdit && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Yeni kural eklemek için yukarıdaki butonu kullanın
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Rule Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editRule ? 'Aspect Rule Düzenle' : 'Yeni Aspect Rule Ekle'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Tip Adı *"
              value={formData.tipAdi}
              onChange={(e) => setFormData(prev => ({ ...prev, tipAdi: e.target.value }))}
              placeholder="Örn: Yataylar, Dikeyler"
              required
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
  fullWidth
  label="Minimum Ratio *"
  type="number"
  value={formData.minRatio}
  onChange={(e) => {
    const value = e.target.value.replace(',', '.');
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, minRatio: numValue }));
  }}
  inputProps={{ step: 0.001, min: 0 }}
  required
/>

<TextField
  fullWidth
  label="Maksimum Ratio *"
  type="number"
  value={formData.maxRatio}
  onChange={(e) => {
    const value = e.target.value.replace(',', '.');
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, maxRatio: numValue }));
  }}
  inputProps={{ step: 0.001, min: 0 }}
  required
/>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Master Width (px)"
                type="number"
                value={formData.masterWidth}
                onChange={(e) => setFormData(prev => ({ ...prev, masterWidth: parseInt(e.target.value) || 1920 }))}
                inputProps={{ min: 1 }}
              />
              
              <TextField
                fullWidth
                label="Master Height (px)"
                type="number"
                value={formData.masterHeight}
                onChange={(e) => setFormData(prev => ({ ...prev, masterHeight: parseInt(e.target.value) || 1920 }))}
                inputProps={{ min: 1 }}
              />
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Örnek Ratio Değerleri:</strong><br/>
                • 0.0 - 0.1: Dikey Kayarlar (108×1920)<br/>
                • 0.1 - 0.8: Dikeyler (1080×1920)<br/>
                • 0.8 - 1.2: Kareler (1920×1920)<br/>
                • 1.2 - 7.0: Yataylar (1920×1080)<br/>
                • 7.0+: Yatay Kayarlar (2700×200)
              </Typography>
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleFormSubmit}
            variant="contained"
          >
            {editRule ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Kural Silme Onayı</DialogTitle>
        <DialogContent>
          <Typography>
            "{ruleToDelete?.tipAdi}" kuralını silmek istediğinizden emin misiniz?
            Bu kural silindiğinde, LED'lerin tip sınıflandırması etkilenebilir.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AspectRulesManagement;