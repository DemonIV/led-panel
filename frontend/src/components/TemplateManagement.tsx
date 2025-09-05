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
  Grid,
  Avatar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Refresh,
  Movie,
  Transform,
  Login as LogoIntro,
  Logout as LogoOutro,
  DirectionsRun as ShoeInOut
} from '@mui/icons-material';
import { templateAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Template {
  templateID?: number;
  templateName: string;
  templateType: 'shoe_in_out' | 'transition' | 'logo_intro' | 'logo_outro';
  duration: number;
  templatePath?: string;
  previewImage?: string;
  defaultSettings?: any;
  compatibleAssetTypes?: string[];
  isActive?: boolean;
  authorName?: string;
  usageCount?: number;
  createdAt?: string;
}

interface TemplateStats {
  totalTemplates: number;
  shoeTemplates: number;
  logoIntroTemplates: number;
  logoOutroTemplates: number;
  transitionTemplates: number;
  avgDuration: number;
  mostUsedTemplates: Array<{
    templateName: string;
    usageCount: number;
  }>;
}

const TemplateManagement: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<Partial<Template>>({
    templateName: '',
    templateType: 'shoe_in_out',
    duration: 3.0,
    templatePath: '',
    previewImage: '',
    defaultSettings: {},
    compatibleAssetTypes: [],
    isActive: true
  });

  const canEdit = user?.role === 'admin' || user?.role === 'ajans';
  const canDelete = user?.role === 'admin';

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const [templatesResponse, statsResponse] = await Promise.all([
        templateAPI.getAll(),
        templateAPI.getStats()
      ]);
      
      setTemplates(templatesResponse.data.data || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Templates alınamadı:', error);
      setError('Templateler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddNew = () => {
    setEditTemplate(null);
    setFormData({
      templateName: '',
      templateType: 'shoe_in_out',
      duration: 3.0,
      templatePath: '',
      previewImage: '',
      defaultSettings: {},
      compatibleAssetTypes: [],
      isActive: true
    });
    setFormOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditTemplate(template);
    setFormData({
      ...template,
      defaultSettings: template.defaultSettings || {},
      compatibleAssetTypes: template.compatibleAssetTypes || []
    });
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      setError('');
      
      if (!formData.templateName || !formData.templateType) {
        setError('Template adı ve tip zorunludur');
        return;
      }

      if (editTemplate) {
        await templateAPI.update(editTemplate.templateID!, formData);
        setSuccess('Template güncellendi');
      } else {
        await templateAPI.create(formData);
        setSuccess('Yeni template oluşturuldu');
      }

      setFormOpen(false);
      fetchTemplates();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Template kaydedilemedi');
    }
  };

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      await templateAPI.delete(templateToDelete.templateID!);
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
      setSuccess('Template silindi');
      fetchTemplates();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Template silinemedi');
    }
  };

  const getTemplateTypeIcon = (type: string) => {
    switch (type) {
      case 'shoe_in_out': return <ShoeInOut />;
      case 'transition': return <Transform />;
      case 'logo_intro': return <LogoIntro />;
      case 'logo_outro': return <LogoOutro />;
      default: return <Movie />;
    }
  };

  const getTemplateTypeText = (type: string) => {
    switch (type) {
      case 'shoe_in_out': return 'Shoe In/Out';
      case 'transition': return 'Transition';
      case 'logo_intro': return 'Logo Intro';
      case 'logo_outro': return 'Logo Outro';
      default: return type;
    }
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'shoe_in_out': return 'primary';
      case 'transition': return 'secondary';
      case 'logo_intro': return 'success';
      case 'logo_outro': return 'warning';
      default: return 'default';
    }
  };

  const formatDuration = (duration: number) => {
    return `${duration}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  if (loading) {
    return <Typography>Template'ler yükleniyor...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Template Yönetimi 🎬
          </Typography>
          <Typography variant="body2" color="text.secondary">
            After Effects şablonlarını yönetin
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchTemplates}
          >
            Yenile
          </Button>
          
          {canEdit && (
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={handleAddNew}
            >
              Yeni Template
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
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stats.totalTemplates}
                  </Typography>
                  <Typography color="text.secondary">Toplam Template</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {stats.shoeTemplates}
                  </Typography>
                  <Typography color="text.secondary">Shoe Templates</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {stats.logoIntroTemplates}
                  </Typography>
                  <Typography color="text.secondary">Logo Intro</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {stats.logoOutroTemplates}
                  </Typography>
                  <Typography color="text.secondary">Logo Outro</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary.main">
                    {stats.transitionTemplates}
                  </Typography>
                  <Typography color="text.secondary">Transitions</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Template Tablosu */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Template</strong></TableCell>
                  <TableCell><strong>Tip</strong></TableCell>
                  <TableCell><strong>Süre</strong></TableCell>
                  <TableCell><strong>Kullanım</strong></TableCell>
                  <TableCell><strong>Yazar</strong></TableCell>
                  <TableCell><strong>Durum</strong></TableCell>
                  {canEdit && <TableCell><strong>İşlemler</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.templateID} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {template.previewImage ? (
                          <Avatar 
                            src={template.previewImage} 
                            sx={{ width: 40, height: 40 }}
                            variant="rounded"
                          />
                        ) : (
                          <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.300' }} variant="rounded">
                            {getTemplateTypeIcon(template.templateType)}
                          </Avatar>
                        )}
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {template.templateName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {template.templatePath || 'Path belirtilmemiş'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={getTemplateTypeText(template.templateType)}
                        color={getTemplateTypeColor(template.templateType) as any}
                        icon={getTemplateTypeIcon(template.templateType)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(template.duration)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {template.usageCount || 0} kez
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {template.authorName || 'Sistem'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={template.isActive ? 'Aktif' : 'Pasif'}
                        color={template.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    
                    {canEdit && (
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEdit(template)}
                            title="Düzenle"
                          >
                            <Edit />
                          </IconButton>
                          
                          {canDelete && (
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(template)}
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

          {templates.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Henüz template oluşturulmamış
              </Typography>
              {canEdit && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Yeni template eklemek için yukarıdaki butonu kullanın
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Template Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editTemplate ? 'Template Düzenle' : 'Yeni Template Oluştur'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Template Adı *"
              value={formData.templateName}
              onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
              placeholder="Örn: Nike Shoe Intro"
              required
            />

            <FormControl fullWidth>
              <InputLabel>Template Tipi</InputLabel>
              <Select
                value={formData.templateType}
                onChange={(e) => setFormData(prev => ({ ...prev, templateType: e.target.value as any }))}
                label="Template Tipi"
              >
                <MenuItem value="shoe_in_out">👟 Shoe In/Out</MenuItem>
                <MenuItem value="transition">🔄 Transition</MenuItem>
                <MenuItem value="logo_intro">🎬 Logo Intro</MenuItem>
                <MenuItem value="logo_outro">🎭 Logo Outro</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Süre (saniye)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) || 3.0 }))}
              inputProps={{ step: 0.1, min: 0.1 }}
            />

            <TextField
              fullWidth
              label="Template Path"
              value={formData.templatePath}
              onChange={(e) => setFormData(prev => ({ ...prev, templatePath: e.target.value }))}
              placeholder="/path/to/template.aep"
            />

            <TextField
              fullWidth
              label="Önizleme Görseli URL"
              value={formData.previewImage}
              onChange={(e) => setFormData(prev => ({ ...prev, previewImage: e.target.value }))}
              placeholder="https://example.com/preview.jpg"
            />

            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value as boolean }))}
                label="Durum"
              >
                <MenuItem value={true}>Aktif</MenuItem>
                <MenuItem value={false}>Pasif</MenuItem>
              </Select>
            </FormControl>
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
            {editTemplate ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Template Silme Onayı</DialogTitle>
        <DialogContent>
          <Typography>
            "{templateToDelete?.templateName}" template'ini silmek istediğinizden emin misiniz?
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

export default TemplateManagement;