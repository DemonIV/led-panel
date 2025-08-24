// frontend/src/components/CleanupManagement.tsx
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
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  CleaningServices,
  Analytics,
  Warning,
  CheckCircle,
  Delete,
  Visibility
} from '@mui/icons-material';
import { cleanupAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface CleanupStats {
  toplamKayit: number;
  benzersizLedKodu: number;
  duplicateKayitSayisi: number;
  duplicateGrupSayisi: number;
}

interface DuplicateGroup {
  ledKodu: string;
  kayitSayisi: number;
  boyutlar: string;
  enKucukAlan: number;
  enBuyukAlan: number;
}

interface DeletionLog {
  ledKodu: string;
  keptRecord: string;
  deletedRecords: Array<{
    ledID: number;
    boyut: string;
    alan: number;
    tip: string;
  }>;
}

const CleanupManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deletionLog, setDeletionLog] = useState<DeletionLog[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const canCleanup = user?.role === 'admin' || user?.role === 'ajans';

  const fetchCleanupData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Stats ve duplicate analizi paralel çek
      const [statsResponse, duplicatesResponse] = await Promise.all([
        cleanupAPI.getStats(),
        cleanupAPI.analyzeDuplicates()
      ]);
      
      setStats(statsResponse.data.stats);
      setDuplicates(duplicatesResponse.data.duplicates || []);
      
      console.log('🧹 Cleanup verileri yüklendi');
    } catch (err: any) {
      console.error('Cleanup veri hatası:', err);
      setError(err.response?.data?.error || 'Cleanup verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleanupData();
  }, []);

  const handlePreviewCleanup = async () => {
    try {
      setCleanupLoading(true);
      
      const response = await cleanupAPI.cleanupDuplicates(true); // dryRun = true
      setDeletionLog(response.data.deletionLog || []);
      setPreviewDialogOpen(true);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Preview başarısız');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleConfirmCleanup = async () => {
    try {
      setCleanupLoading(true);
      
      const response = await cleanupAPI.cleanupDuplicates(false); // dryRun = false
      
      setSuccess(`🎉 Temizlik tamamlandı! ${response.data.summary.recordsDeleted} kayıt silindi.`);
      setConfirmDialogOpen(false);
      setPreviewDialogOpen(false);
      
      // Verileri yenile
      await fetchCleanupData();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Temizlik başarısız');
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1000000).toFixed(1) + ' MB';
  };

  const getStatusColor = (duplicateCount: number) => {
    if (duplicateCount === 0) return 'success';
    if (duplicateCount < 10) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cleanup analizi yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Otomatik Temizlik Sistemi 🧹
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Duplicate LED kayıtlarını analiz et ve temizle
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={fetchCleanupData}
          >
            Yenile
          </Button>
          
          {canCleanup && duplicates.length > 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={handlePreviewCleanup}
                disabled={cleanupLoading}
              >
                Önizleme
              </Button>
              
              <Button
                variant="contained"
                color="warning"
                startIcon={<CleaningServices />}
                onClick={() => setConfirmDialogOpen(true)}
                disabled={cleanupLoading}
              >
                Temizlik Başlat
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

      {/* İstatistikler */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {stats?.toplamKayit || 0}
            </Typography>
            <Typography color="text.secondary">Toplam Kayıt</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {stats?.benzersizLedKodu || 0}
            </Typography>
            <Typography color="text.secondary">Benzersiz LED Kodu</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {stats?.duplicateKayitSayisi || 0}
            </Typography>
            <Typography color="text.secondary">Duplicate Kayıt</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {stats?.duplicateGrupSayisi || 0}
            </Typography>
            <Typography color="text.secondary">Duplicate Grup</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Duplicate Analizi */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ mr: 1, color: 'warning.main' }} />
            Duplicate LED Analizi
          </Typography>

          {duplicates.length === 0 ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body1">
                🎉 Harika! Hiç duplicate kayıt bulunamadı. Sisteminiz temiz!
              </Typography>
            </Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {duplicates.length} farklı LED kodunda duplicate kayıt bulundu. 
                  Temizlik işlemi büyük boyutlu kayıtları siler, en küçük boyutu tutar.
                </Typography>
              </Alert>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>LED Kodu</strong></TableCell>
                      <TableCell align="center"><strong>Duplicate Sayısı</strong></TableCell>
                      <TableCell><strong>Boyutlar</strong></TableCell>
                      <TableCell align="right"><strong>Alan Farkı</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {duplicates.slice(0, 10).map((duplicate, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {duplicate.ledKodu}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip 
                            label={duplicate.kayitSayisi}
                            color={getStatusColor(duplicate.kayitSayisi)}
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="caption" sx={{ maxWidth: 300, display: 'block' }}>
                            {duplicate.boyutlar}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="right">
                          <Typography variant="body2">
                            {(duplicate.enBuyukAlan - duplicate.enKucukAlan).toLocaleString()} px²
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {duplicates.length > 10 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ... ve {duplicates.length - 10} grup daha
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Önizleme Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Temizlik Önizlemesi 👀</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Bu işlem ile silinecek kayıtlar:
          </Typography>
          
          <List dense>
            {deletionLog.map((log, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`${log.ledKodu} - Tutulacak: ${log.keptRecord}`}
                  secondary={`Silinecek: ${log.deletedRecords.length} kayıt (${log.deletedRecords.map(r => r.boyut).join(', ')})`}
                />
              </ListItem>
            ))}
          </List>

          <Alert severity="info" sx={{ mt: 2 }}>
            Toplam {deletionLog.reduce((sum, log) => sum + log.deletedRecords.length, 0)} kayıt silinecek
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Kapat</Button>
          <Button onClick={() => setConfirmDialogOpen(true)} color="warning" variant="contained">
            Temizliği Başlat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cleanup Onay Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>⚠️ Temizlik Onayı</DialogTitle>
        <DialogContent>
          <Typography>
            {duplicates.length} grup duplicate LED kaydından büyük boyutlular silinecek.
            Bu işlem <strong>geri alınamaz!</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Devam etmek istediğinizden emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>İptal</Button>
          <Button 
            onClick={handleConfirmCleanup} 
            color="error" 
            variant="contained"
            disabled={cleanupLoading}
            startIcon={cleanupLoading ? <CircularProgress size={20} /> : <Delete />}
          >
            {cleanupLoading ? 'Temizleniyor...' : 'Evet, Temizle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CleanupManagement;