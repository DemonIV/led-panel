// frontend/src/components/ProjectManagement.tsx
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
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Folder,
  Movie,
  Image,
  Refresh,
  CloudUpload,
  Visibility
} from '@mui/icons-material';
import { Project } from '../types/project.types';
import { projectAPI, assetAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ProjectManagement: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<Partial<Project>>({
    projectName: '',
    projectType: 'shoe',
    description: '',
    status: 'active'
  });

  const canEdit = user?.role === 'admin' || user?.role === 'ajans';
  const canDelete = user?.role === 'admin';

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Projeler alınamadı:', error);
      setError('Projeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddNew = () => {
    setEditProject(null);
    setFormData({
      projectName: '',
      projectType: 'shoe',
      description: '',
      status: 'active'
    });
    setFormOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setFormData({
      projectName: project.projectName,
      projectType: project.projectType,
      description: project.description || '',
      status: project.status
    });
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      setError('');
      
      if (!formData.projectName) {
        setError('Proje adı zorunludur');
        return;
      }

      if (editProject) {
        await projectAPI.update(editProject.projectID!, formData);
        setSuccess('Proje güncellendi');
      } else {
        await projectAPI.create(formData);
        setSuccess('Yeni proje oluşturuldu');
      }

      setFormOpen(false);
      fetchProjects();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Proje kaydedilemedi');
    }
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await projectAPI.delete(projectToDelete.projectID!);
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
      setSuccess('Proje silindi');
      fetchProjects();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Proje silinemedi');
    }
  };

  // 📌 EKLENEN FONKSİYONLAR
  const handleViewDetails = async (project: Project) => {
    try {
      setSelectedProject(project);
      setDetailOpen(true);
      const response = await assetAPI.getByProject(project.projectID!);
      setAssets(response.data);
    } catch (err: any) {
      setError('Asset listesi yüklenemedi');
    }
  };
  const getAssetTypeFromFile = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'psd':
      return '2D_logo';
    case 'c4d':
    case 'obj':
    case 'fbx':
      return '3D_shoe';
    case 'aep':
      return 'text_machine';
    default:
      return 'solid';
  }
};

  const handleAssetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || !selectedProject) return;

  try {
    const formData = new FormData();
    formData.append('assetFile', file);
    formData.append('assetName', file.name);
    formData.append('assetType', getAssetTypeFromFile(file.name));
    formData.append('projectID', selectedProject.projectID!.toString());

    // İLK PARAMETRE: projectID, İKİNCİ PARAMETRE: formData
    await assetAPI.upload(selectedProject.projectID!, formData);
    
    setSuccess('Asset başarıyla yüklendi');
    
    // Assets listesini yenile
    const response = await assetAPI.getByProject(selectedProject.projectID!);
    setAssets(response.data);
    
    setTimeout(() => setSuccess(''), 3000);
  } catch (error: any) {
    setError(error.response?.data?.error || 'Asset yükleme başarısız');
  }
};

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image fontSize="small" />;
      case 'video': return <Movie fontSize="small" />;
      case 'folder': return <Folder fontSize="small" />;
      default: return <Folder fontSize="small" />;
    }
  };

  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
    return parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  // 📌 EKLENEN FONKSİYONLAR SONU

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'shoe': return '👟';
      case 'logo': return '🏷️';
      case 'mixed': return '🎬';
      default: return '📁';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  if (loading) {
    return <Typography>Projeler yükleniyor...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Proje Yönetimi 🎬
          </Typography>
          <Typography variant="body2" color="text.secondary">
            After Effects projelerinizi yönetin
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchProjects}
          >
            Yenile
          </Button>
          
          {canEdit && (
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={handleAddNew}
            >
              Yeni Proje
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
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {projects.length}
            </Typography>
            <Typography color="text.secondary">Toplam Proje</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {projects.filter(p => p.status === 'active').length}
            </Typography>
            <Typography color="text.secondary">Aktif Proje</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {projects.filter(p => p.status === 'completed').length}
            </Typography>
            <Typography color="text.secondary">Tamamlanan</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Proje Tablosu */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Proje</strong></TableCell>
                  <TableCell><strong>Tip</strong></TableCell>
                  <TableCell><strong>Durum</strong></TableCell>
                  <TableCell><strong>Asset Sayısı</strong></TableCell>
                  <TableCell><strong>Oluşturulma</strong></TableCell>
                  {canEdit && <TableCell><strong>İşlemler</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.projectID} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{getProjectTypeIcon(project.projectType)}</span>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {project.projectName}
                          </Typography>
                          {project.description && (
                            <Typography variant="caption" color="text.secondary">
                              {project.description.substring(0, 50)}...
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={project.projectType} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={project.status} 
                        size="small"
                        color={getStatusColor(project.status) as any}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {project.assetCount || 0} asset
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="caption">
                        {project.createdAt && formatDate(project.createdAt)}
                      </Typography>
                    </TableCell>
                    
                    {canEdit && (
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleViewDetails(project)}
                            title="Detaylar ve Asset'ler"
                          >
                            <Visibility />
                          </IconButton>
                          
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEdit(project)}
                            title="Düzenle"
                          >
                            <Edit />
                          </IconButton>
                          
                          {canDelete && (
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(project)}
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

          {projects.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Henüz proje oluşturulmamış
              </Typography>
              {canEdit && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Yeni proje eklemek için yukarıdaki butonu kullanın
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Proje Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editProject ? 'Proje Düzenle' : 'Yeni Proje Oluştur'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Proje Adı *"
              value={formData.projectName}
              onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
              placeholder="Örn: Adidas Boost Kampanya"
              required
            />

            <FormControl fullWidth>
              <InputLabel>Proje Tipi</InputLabel>
              <Select
                value={formData.projectType}
                onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value as any }))}
                label="Proje Tipi"
              >
                <MenuItem value="shoe">👟 Shoe Project</MenuItem>
                <MenuItem value="logo">🏷️ Logo Project</MenuItem>
                <MenuItem value="mixed">🎬 Mixed Project</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                label="Durum"
              >
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="completed">Tamamlandı</MenuItem>
                <MenuItem value="archived">Arşivlendi</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Açıklama"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              placeholder="Proje hakkında detaylar..."
            />
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
            {editProject ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Proje Detay ve Asset Management Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{getProjectTypeIcon(selectedProject?.projectType || 'shoe')}</span>
              <Typography variant="h6">
                {selectedProject?.projectName}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUpload />}
              size="small"
            >
              Asset Upload
              <input
                type="file"
                hidden
                onChange={handleAssetUpload}
                accept=".png,.jpg,.jpeg,.psd,.ai,.aep,.mp4,.mov,.c4d,.obj,.fbx"
              />
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedProject && (
            <Box>
              {/* Proje Bilgileri */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Proje Bilgileri</Typography>
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Tip</Typography>
                      <Chip label={selectedProject.projectType} size="small" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Durum</Typography>
                      <Chip 
                        label={selectedProject.status} 
                        size="small" 
                        color={getStatusColor(selectedProject.status) as any} 
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Asset Sayısı</Typography>
                      <Typography variant="body1">{assets.length}</Typography>
                    </Box>
                  </Box>
                  {selectedProject.description && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Açıklama</Typography>
                      <Typography variant="body1">{selectedProject.description}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Asset Listesi */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assets ({assets.length})
                  </Typography>
                  
                  {assets.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CloudUpload sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Henüz asset yüklenmemiş
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Yukarıdaki "Asset Upload" butonunu kullanarak dosya yükleyin
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Asset</TableCell>
                            <TableCell>Tip</TableCell>
                            <TableCell>Boyut</TableCell>
                            <TableCell>Yüklenme</TableCell>
                            <TableCell>İşlemler</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {assets.map((asset) => (
                            <TableRow key={asset.assetID}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <span>{getAssetIcon(asset.assetType)}</span>
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                      {asset.assetName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {asset.filePath?.split('/').pop()}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              
                              <TableCell>
                                <Chip 
                                  label={asset.assetType.replace('_', ' ')} 
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              
                              <TableCell>
                                <Typography variant="body2">
                                  {asset.fileSize ? formatFileSize(asset.fileSize) : 'Unknown'}
                                </Typography>
                              </TableCell>
                              
                              <TableCell>
                                <Typography variant="caption">
                                  {asset.createdAt && formatDate(asset.createdAt)}
                                </Typography>
                              </TableCell>
                              
                              <TableCell>
                                {canDelete && (
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={async () => {
                                      try {
                                        await assetAPI.delete(asset.assetID);
                                        const response = await assetAPI.getByProject(selectedProject.projectID!);
                                        setAssets(response.data);
                                        setSuccess('Asset silindi');
                                        setTimeout(() => setSuccess(''), 3000);
                                      } catch (error: any) {
                                        setError('Asset silinemedi');
                                      }
                                    }}
                                    title="Sil"
                                  >
                                    <Delete />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Proje Silme Onayı</DialogTitle>
        <DialogContent>
          <Typography>
            "{projectToDelete?.projectName}" projesini silmek istediğinizden emin misiniz?
            Bu işlem geri alınamaz ve tüm asset'ler silinecektir.
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

export default ProjectManagement;