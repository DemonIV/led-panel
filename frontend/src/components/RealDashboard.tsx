// frontend/src/components/RealDashboard.tsx - Box Layout ile Düzeltildi
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
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Memory,
  Store,
  Category,
  TrendingUp,
  Download,
  Refresh
} from '@mui/icons-material';
import { reportsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  toplamLED: number;
  toplamMagaza: number;
  toplamTip: number;
  bugunEklenen: number;
  haftalikEklenen: number;
  aylikEklenen: number;
}

interface TipDagilimi {
  tip: string;
  adet: number;
  ortalamaBoyut: number;
}

interface SehirDagilimi {
  sehir: string;
  adet: number;
}

const RealDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tipDagilimi, setTipDagilimi] = useState<TipDagilimi[]>([]);
  const [sehirDagilimi, setSehirDagilimi] = useState<SehirDagilimi[]>([]);
  const [error, setError] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    sehir: [],
    tip: [],
    includeInactive: false
  });

  const canExport = user?.role === 'admin' || user?.role === 'ajans';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await reportsAPI.getDashboardStats();
      const data = response.data;
      
      setStats(data.stats);
      setTipDagilimi(data.tipDagilimi || []);
      setSehirDagilimi(data.sehirDagilimi || []);
      
      console.log('📊 Dashboard verileri yüklendi:', data);
    } catch (err: any) {
      console.error('Dashboard veri hatası:', err);
      setError(err.response?.data?.error || 'Dashboard verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExportCSV = async () => {
    if (!canExport) {
      alert('CSV export yetkiniz yok');
      return;
    }

    try {
      setExportLoading(true);
      
      const filters = {
        startDate: exportFilters.startDate || null,
        endDate: exportFilters.endDate || null,
        sehir: exportFilters.sehir.length > 0 ? exportFilters.sehir : null,
        tip: exportFilters.tip.length > 0 ? exportFilters.tip : null,
        includeInactive: exportFilters.includeInactive
      };

      const response = await reportsAPI.exportToCSV(filters);
      
      // Blob'u dosya olarak indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `led-panels-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setExportDialogOpen(false);
      console.log('📁 CSV export başarılı');
    } catch (err: any) {
      console.error('CSV export hatası:', err);
      alert(err.response?.data?.error || 'CSV export başarısız');
    } finally {
      setExportLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  const getTipColor = (tip: string) => {
    const colors: { [key: string]: any } = {
      'Dikey Kayarlar': 'error',
      'Dikeyler': 'warning', 
      'Kareler': 'success',
      'Yataylar': 'info',
      'Yatay Kayarlar': 'secondary',
      'Belirsiz': 'default'
    };
    return colors[tip] || 'primary';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Dashboard yükleniyor...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            Tekrar Dene
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık ve İşlemler */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard 📊
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton onClick={fetchDashboardData} title="Yenile">
            <Refresh />
          </IconButton>
          {canExport && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => setExportDialogOpen(true)}
            >
              CSV Export
            </Button>
          )}
        </Box>
      </Box>

      {/* Ana İstatistik Kartları - ✅ Flexbox Layout */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 4,
          flexWrap: 'wrap'
        }}
      >
        {/* LED Panel Sayısı */}
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Memory sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="primary">
                {formatNumber(stats?.toplamLED || 0)}
              </Typography>
              <Typography color="text.secondary">
                Toplam LED Panel
              </Typography>
              {stats?.bugunEklenen && stats.bugunEklenen > 0 && (
                <Chip 
                  label={`+${stats.bugunEklenen} bugün`} 
                  size="small" 
                  color="success" 
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Mağaza Sayısı */}
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Store sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="secondary">
                {formatNumber(stats?.toplamMagaza || 0)}
              </Typography>
              <Typography color="text.secondary">
                Toplam Mağaza
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Tip Sayısı */}
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Category sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="warning.main">
                {formatNumber(stats?.toplamTip || 0)}
              </Typography>
              <Typography color="text.secondary">
                Farklı Tip
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Haftalık Eklenenler */}
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="success.main">
                {formatNumber(stats?.haftalikEklenen || 0)}
              </Typography>
              <Typography color="text.secondary">
                Son 7 Gün
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatNumber(stats?.aylikEklenen || 0)} (30 gün)
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Alt Bilgiler - ✅ Flexbox Layout */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 3,
          flexWrap: 'wrap'
        }}
      >
        {/* Tip Dağılımı */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                LED Tip Dağılımı 📋
              </Typography>
              {tipDagilimi.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Tip</strong></TableCell>
                        <TableCell align="right"><strong>Adet</strong></TableCell>
                        <TableCell align="right"><strong>Ort. Boyut</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tipDagilimi.map((tip, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip 
                              label={tip.tip || 'Belirsiz'} 
                              size="small"
                              color={getTipColor(tip.tip)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {formatNumber(tip.adet)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatNumber(Math.round(tip.ortalamaBoyut))} px²
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">Veri bulunamadı</Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Şehir Dağılımı */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Şehir Dağılımı 🌍
              </Typography>
              {sehirDagilimi.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Şehir</strong></TableCell>
                        <TableCell align="right"><strong>LED Sayısı</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sehirDagilimi.slice(0, 8).map((sehir, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">
                              {sehir.sehir || 'Belirtilmemiş'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {formatNumber(sehir.adet)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">Veri bulunamadı</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* CSV Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Download sx={{ mr: 1 }} />
            CSV Export
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Başlangıç Tarihi"
              type="date"
              value={exportFilters.startDate}
              onChange={(e) => setExportFilters(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Bitiş Tarihi"
              type="date"
              value={exportFilters.endDate}
              onChange={(e) => setExportFilters(prev => ({ ...prev, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <Typography variant="body2" color="text.secondary">
              Tarih belirtmezseniz tüm veriler export edilir.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            İptal
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="contained"
            disabled={exportLoading}
            startIcon={exportLoading ? <CircularProgress size={20} /> : <Download />}
          >
            {exportLoading ? 'Export Ediliyor...' : 'Export Et'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RealDashboard;