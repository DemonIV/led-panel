import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { LED } from '../types/led.types';
import { ledAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LEDForm from './LEDForm';

const LEDList: React.FC = () => {
  const [leds, setLeds] = useState<LED[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editLed, setEditLed] = useState<LED | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ledToDelete, setLedToDelete] = useState<LED | null>(null);
  const { user } = useAuth();

  // Admin ve ajans mı kontrol et
  const canEdit = user?.role === 'admin' || user?.role === 'ajans';
  const canDelete = user?.role === 'admin';
  const canSeeDetails = user?.role === 'admin' || user?.role === 'ajans';

  const fetchLeds = async () => {
    try {
      setLoading(true);
      const response = await ledAPI.getAll();
      setLeds(response.data);
    } catch (error) {
      console.error('LED listesi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeds();
  }, []);

  const handleAddNew = () => {
    setEditLed(null);
    setFormOpen(true);
  };

  const handleEdit = (led: LED) => {
    setEditLed(led);
    setFormOpen(true);
  };

  const handleDeleteClick = (led: LED) => {
    setLedToDelete(led);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ledToDelete) return;

    try {
      await ledAPI.delete(ledToDelete.ledID!);
      await fetchLeds(); // Listeyi yenile
      setDeleteConfirmOpen(false);
      setLedToDelete(null);
    } catch (error) {
      console.error('LED silinemedi:', error);
      alert('LED silinirken hata oluştu');
    }
  };

  const handleFormSuccess = () => {
    fetchLeds(); // Listeyi yenile
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'aktif': return 'success';
      case 'pasif': return 'error';
      case 'bakım': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return <Typography>Yükleniyor...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          LED Panel Listesi ({leds.length})
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={fetchLeds}
            disabled={loading}
          >
            Yenile
          </Button>
          
          {canEdit && (
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={handleAddNew}
            >
              Yeni LED Ekle
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>LED Kodu</strong></TableCell>
              <TableCell><strong>Boyutlar</strong></TableCell>
              <TableCell><strong>Aspect Ratio</strong></TableCell>
              <TableCell><strong>Tip</strong></TableCell>
              <TableCell><strong>Durum</strong></TableCell>
              {canSeeDetails && <TableCell><strong>Mağaza</strong></TableCell>}
              {canSeeDetails && <TableCell><strong>Oluşturulma</strong></TableCell>}
              {canSeeDetails && <TableCell><strong>Güncellenme</strong></TableCell>}
              {canEdit && <TableCell><strong>İşlemler</strong></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {leds.map((led) => (
              <TableRow key={led.ledID} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {led.ledKodu}
                  </Typography>
                  {led.notlar && (
                    <Typography variant="caption" color="text.secondary">
                      {led.notlar.substring(0, 30)}...
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {led.enPx} × {led.boyPx} px
                  </Typography>
                </TableCell>
                
                <TableCell>
<Typography variant="body2">
        {(() => {
        const aspectValue = led.aspect;
        if (typeof aspectValue === 'number') {
            return aspectValue.toFixed(3);
        }
        if (typeof aspectValue === 'string') {
            const parsed = parseFloat(aspectValue);
            return isNaN(parsed) ? '0.000' : parsed.toFixed(3);
        }
      return '0.000';
        })()}
                    </Typography>
                </TableCell>
                
                <TableCell>
                  <Chip 
                    label={led.tip || 'Belirsiz'} 
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell>
                  <Chip 
                    label={led.ozelDurum || 'Belirsiz'} 
                    size="small"
                    color={getStatusColor(led.ozelDurum)}
                  />
                </TableCell>
                
                {canSeeDetails && (
                  <TableCell>
                    <Typography variant="body2">
                      {led.magazaAdi || 'Atanmamış'}
                    </Typography>
                  </TableCell>
                )}
                
                {canSeeDetails && (
                  <TableCell>
                    <Typography variant="caption">
                      {led.createdAt && formatDate(led.createdAt)}
                    </Typography>
                  </TableCell>
                )}
                
                {canSeeDetails && (
                  <TableCell>
                    <Typography variant="caption">
                      {led.updatedAt && formatDate(led.updatedAt)}
                    </Typography>
                  </TableCell>
                )}
                
                {canEdit && (
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEdit(led)}
                        title="Düzenle"
                      >
                        <Edit />
                      </IconButton>
                      
                      {canDelete && (
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(led)}
                          title="Sil"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {leds.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Henüz LED paneli eklenmemiş.
          </Typography>
          {canEdit && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Yeni LED eklemek için yukarıdaki butonu kullanın.
            </Typography>
          )}
        </Box>
      )}

      {/* LED Form Modal */}
      <LEDForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        editLed={editLed}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>LED Panel Silme Onayı</DialogTitle>
        <DialogContent>
          <Typography>
            "{ledToDelete?.ledKodu}" kodlu LED panelini silmek istediğinizden emin misiniz?
            Bu işlem geri alınamaz.
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

export default LEDList;