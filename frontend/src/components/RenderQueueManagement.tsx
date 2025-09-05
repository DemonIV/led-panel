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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add,
  Delete,
  Refresh,
  PlayArrow,
  Pause,
  Stop,
  Queue,
  Schedule,
  CheckCircle,
  Error,
  Visibility
} from '@mui/icons-material';
import { renderQueueAPI, projectAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface RenderJob {
  queueID?: number;
  projectID: number;
  projectName?: string;
  projectType?: string;
  templateID?: number;
  templateName?: string;
  outputPath: string;
  renderSettings?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTime?: number;
  actualTime?: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  createdByName?: string;
}

interface RenderStats {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgRenderTime: number;
  totalRenderTime: number;
  recentJobs: RenderJob[];
}

const RenderQueueManagement: React.FC = () => {
  const { user } = useAuth();
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);
  const [stats, setStats] = useState<RenderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    projectID: '',
    templateID: '',
    outputPath: '',
    renderSettings: '{}',
    estimatedTime: 300
  });

  const canEdit = user?.role === 'admin' || user?.role === 'ajans';

  const fetchRenderQueue = async (status?: string) => {
    try {
      setLoading(true);
      const [queueResponse, statsResponse] = await Promise.all([
        renderQueueAPI.getQueue(status),
        renderQueueAPI.getStats()
      ]);
      
      setRenderJobs(queueResponse.data.data || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Render queue alınamadı:', error);
      setError('Render queue yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Projeler alınamadı:', error);
    }
  };

  useEffect(() => {
    fetchRenderQueue();
    fetchProjects();
    
    // Auto-refresh her 10 saniyede bir
    const interval = setInterval(() => {
      fetchRenderQueue();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    const statusFilters = ['', 'pending', 'processing', 'completed', 'failed'];
    fetchRenderQueue(statusFilters[newValue]);
  };

  const handleAddToQueue = async () => {
    try {
      setError('');
      
      if (!formData.projectID || !formData.outputPath) {
        setError('Proje ve çıktı yolu zorunludur');
        return;
      }

      const submitData = {
        ...formData,
        projectID: parseInt(formData.projectID),
        templateID: formData.templateID ? parseInt(formData.templateID) : null,
        renderSettings: JSON.parse(formData.renderSettings || '{}')
      };

      await renderQueueAPI.addToQueue(submitData);
      setSuccess('Render kuyruğuna eklendi');
      setFormOpen(false);
      fetchRenderQueue();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Render eklenemedi');
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    try {
      await renderQueueAPI.deleteFromQueue(jobId);
      setSuccess('Render işi silindi');
      fetchRenderQueue();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Render işi silinemedi');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'processing': return <PlayArrow />;
      case 'completed': return <CheckCircle />;
      case 'failed': return <Error />;
      default: return <Queue />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'processing': return 'İşleniyor';
      case 'completed': return 'Tamamlandı';
      case 'failed': return 'Başarısız';
      default: return status;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  if (loading) {
    return <Typography>Render queue yükleniyor...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Render Queue 🎬
          </Typography>
          <Typography variant="body2" color="text.secondary">
            After Effects render kuyruğunu yönetin
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchRenderQueue()}
          >
            Yenile
          </Button>
          
          {canEdit && (
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Render Ekle
            </Button>
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

      {/* İstatistik Kartları */}
{stats && (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {stats.totalJobs}
            </Typography>
            <Typography color="text.secondary">Toplam İş</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {stats.pendingJobs}
            </Typography>
            <Typography color="text.secondary">Bekleyen</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {stats.processingJobs}
            </Typography>
            <Typography color="text.secondary">İşleniyor</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {stats.completedJobs}
            </Typography>
            <Typography color="text.secondary">Tamamlanan</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {stats.failedJobs}
            </Typography>
            <Typography color="text.secondary">Başarısız</Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  </Box>
)}
      {/* Render Queue Tablosu */}
      <Card>
        <CardContent>
          {/* Durum Filtreleme Tabları */}
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Tümü" />
            <Tab label="Bekleyen" />
            <Tab label="İşleniyor" />
            <Tab label="Tamamlanan" />
            <Tab label="Başarısız" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Proje</strong></TableCell>
                  <TableCell><strong>Template</strong></TableCell>
                  <TableCell><strong>Durum</strong></TableCell>
                  <TableCell><strong>İlerleme</strong></TableCell>
                  <TableCell><strong>Süre</strong></TableCell>
                  <TableCell><strong>Oluşturan</strong></TableCell>
                  <TableCell><strong>Tarih</strong></TableCell>
                  {canEdit && <TableCell><strong>İşlemler</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {renderJobs.map((job) => (
                  <TableRow key={job.queueID} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {job.projectName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.projectType}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {job.templateName || 'Template yok'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={getStatusText(job.status)}
                        color={getStatusColor(job.status) as any}
                        icon={getStatusIcon(job.status)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={job.progress || 0} 
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption">
                          {job.progress || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        {job.actualTime && (
                          <Typography variant="body2">
                            {formatTime(job.actualTime)}
                          </Typography>
                        )}
                        {job.estimatedTime && !job.actualTime && (
                          <Typography variant="caption" color="text.secondary">
                            ~{formatTime(job.estimatedTime)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {job.createdByName || 'Sistem'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="caption">
                        {job.createdAt && formatDate(job.createdAt)}
                      </Typography>
                    </TableCell>
                    
                    {canEdit && (
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {job.errorMessage && (
                            <IconButton 
                              size="small" 
                              color="warning"
                              title={job.errorMessage}
                            >
                              <Visibility />
                            </IconButton>
                          )}
                          
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteJob(job.queueID!)}
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

          {renderJobs.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Render kuyruğunda iş bulunmuyor
              </Typography>
              {canEdit && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Yeni render işi eklemek için yukarıdaki butonu kullanın
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Render Ekleme Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Render Kuyruğuna Ekle</DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Proje</InputLabel>
              <Select
                value={formData.projectID}
                onChange={(e) => setFormData(prev => ({ ...prev, projectID: e.target.value }))}
                label="Proje"
              >
                {projects.map(project => (
                  <MenuItem key={project.projectID} value={project.projectID}>
                    {project.projectName} ({project.projectType})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Template ID (Opsiyonel)"
              value={formData.templateID}
              onChange={(e) => setFormData(prev => ({ ...prev, templateID: e.target.value }))}
              placeholder="1"
              type="number"
            />

            <TextField
              fullWidth
              label="Çıktı Yolu *"
              value={formData.outputPath}
              onChange={(e) => setFormData(prev => ({ ...prev, outputPath: e.target.value }))}
              placeholder="C:/Renders/output.mp4"
              required
            />

            <TextField
              fullWidth
              label="Tahmini Süre (saniye)"
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 300 }))}
              inputProps={{ min: 1 }}
            />

            <TextField
              fullWidth
              label="Render Ayarları (JSON)"
              value={formData.renderSettings}
              onChange={(e) => setFormData(prev => ({ ...prev, renderSettings: e.target.value }))}
              multiline
              rows={4}
              placeholder='{"quality": "best", "format": "mp4"}'
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleAddToQueue}
            variant="contained"
          >
            Kuyruğa Ekle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RenderQueueManagement;