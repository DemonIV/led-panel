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
import { Edit, Delete, Add, Visibility } from '@mui/icons-material';
import { Magaza } from '../types/magaza.types';
import { magazaAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import MagazaForm from './MagazaForm';

const MagazaList: React.FC = () => {
  const [magazalar, setMagazalar] = useState<Magaza[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editMagaza, setEditMagaza] = useState<Magaza | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [magazaToDelete, setMagazaToDelete] = useState<Magaza | null>(null);
  const { user } = useAuth();

  const canEdit = user?.role === 'admin' || user?.role === 'ajans';
  const canDelete = user?.role === 'admin';

  const fetchMagazalar = async () => {
    try {
      setLoading(true);
      const response = await magazaAPI.getAll();
      setMagazalar(response.data);
    } catch (error) {
      console.error('Mağaza listesi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMagazalar();
  }, []);

  const handleAddNew = () => {
    setEditMagaza(null);
    setFormOpen(true);
  };

  const handleEdit = (magaza: Magaza) => {
    setEditMagaza(magaza);
    setFormOpen(true);
  };

  const handleDeleteClick = (magaza: Magaza) => {
    setMagazaToDelete(magaza);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!magazaToDelete) return;

    try {
      await magazaAPI.delete(magazaToDelete.magazaID!);
      await fetchMagazalar();
      setDeleteConfirmOpen(false);
      setMagazaToDelete(null);
    } catch (error: any) {
      console.error('Mağaza silinemedi:', error);
      alert(error.response?.data?.error || 'Mağaza silinirken hata oluştu');
    }
  };

  const handleFormSuccess = () => {
    fetchMagazalar();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  if (loading) {
    return <Typography>Yükleniyor...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Mağaza Listesi ({magazalar.length})
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={fetchMagazalar}
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
              Yeni Mağaza Ekle
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Şehir</strong></TableCell>
              <TableCell><strong>Mağaza Adı</strong></TableCell>
              <TableCell><strong>LED Sayısı</strong></TableCell>
              <TableCell><strong>LED Tipleri</strong></TableCell>
              <TableCell><strong>Oluşturulma</strong></TableCell>
              {canEdit && <TableCell><strong>İşlemler</strong></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {magazalar.map((magaza) => (
              <TableRow key={magaza.magazaID} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {magaza.sehir}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {magaza.magazaAdi}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Chip 
                    label={magaza.ledSayisi || 0} 
                    size="small"
                    color={magaza.ledSayisi ? 'success' : 'default'}
                  />
                </TableCell>
                
                <TableCell>
                  {magaza.ledTipleri ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {magaza.ledTipleri.split(',').map((tip, index) => (
                        <Chip 
                          key={index}
                          label={tip.trim()} 
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      LED yok
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell>
                  <Typography variant="caption">
                    {magaza.createdAt && formatDate(magaza.createdAt)}
                  </Typography>
                </TableCell>
                
                {canEdit && (
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEdit(magaza)}
                        title="Düzenle"
                      >
                        <Edit />
                      </IconButton>
                      
                      {canDelete && (
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(magaza)}
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

      {magazalar.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Henüz mağaza eklenmemiş.
          </Typography>
          {canEdit && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Yeni mağaza eklemek için yukarıdaki butonu kullanın.
            </Typography>
          )}
        </Box>
      )}

      {/* Mağaza Form Modal */}
      <MagazaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        editMagaza={editMagaza}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Mağaza Silme Onayı</DialogTitle>
        <DialogContent>
          <Typography>
            "{magazaToDelete?.magazaAdi}" mağazasını silmek istediğinizden emin misiniz?
            {magazaToDelete?.ledSayisi && magazaToDelete.ledSayisi > 0 && (
              <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="body2" color="warning.dark">
                  ⚠️ Bu mağazaya {magazaToDelete.ledSayisi} adet LED atanmış!
                </Typography>
              </Box>
            )}
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

export default MagazaList;