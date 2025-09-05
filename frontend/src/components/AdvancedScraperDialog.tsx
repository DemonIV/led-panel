import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  LinearProgress,
  Tabs,
  Tab,
  // Grid kaldırıldı
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Checkbox,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Link,
  CheckCircle,
  Error,
  Preview,
  Download,
  Settings,
  Image,
  Folder,
  CloudDownload,
  PhotoLibrary,
  SmartDisplay,
  ZoomIn
} from '@mui/icons-material';

interface AdvancedScraperDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ScrapedImage {
  url: string;
  selected: boolean;
  downloaded?: boolean;
  fileName?: string;
  fileSize?: number;
}

interface ProjectSettings {
  createProject: boolean;
  createLED: boolean;
  projectType: 'shoe' | 'logo' | 'mixed';
  projectName: string;
}

// TabPanel component düzeltildi
function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scraper-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const AdvancedScraperDialog: React.FC<AdvancedScraperDialogProps> = ({ 
  open, 
  onClose, 
  onSuccess 
}) => {
  // ... state'ler aynı kalıyor

  const [currentTab, setCurrentTab] = useState(0);
  const [urls, setUrls] = useState<string[]>(['']);
  const [selectedPreset, setSelectedPreset] = useState('generic');
  const [customSelectors, setCustomSelectors] = useState({
    name: '',
    width: '',
    height: '',
    price: '',
    store: '',
    city: '',
    status: '',
    description: '',
    images: ''
  });
  
  const [scrapedImages, setScrapedImages] = useState<ScrapedImage[]>([]);
  const [downloadImages, setDownloadImages] = useState(true);
  const [optimizeImages, setOptimizeImages] = useState(true);
  const [maxImageSize, setMaxImageSize] = useState(2);
  const [imageQuality, setImageQuality] = useState(85);
  
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    createProject: true,
    createLED: true,
    projectType: 'mixed',
    projectName: ''
  });
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [presets, setPresets] = useState<any>({});
  const [progress, setProgress] = useState(0);

  // ... useEffect'ler ve fonksiyonlar aynı kalıyor

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await fetch('/api/scraper/presets', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setPresets(data.presets);
      } catch (err) {
        console.error('Presets yüklenemedi:', err);
      }
    };
    
    if (open) {
      fetchPresets();
    }
  }, [open]);

  useEffect(() => {
    if (selectedPreset && presets[selectedPreset]) {
      setCustomSelectors(presets[selectedPreset]);
    }
  }, [selectedPreset, presets]);

  const addURL = () => {
    setUrls([...urls, '']);
  };

  const removeURL = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updateURL = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleAdvancedPreview = async () => {
    if (!urls[0]) {
      setError('En az bir URL girin');
      return;
    }

    try {
      setPreviewLoading(true);
      setError('');

      const response = await fetch('/api/scraper/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          url: urls[0],
          selectors: customSelectors
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setPreviewData(result.data);
        
        if (result.data.images && result.data.images.length > 0) {
          const imageObjects = result.data.images.map((url: string) => ({
            url: url,
            selected: true,
            downloaded: false
          }));
          setScrapedImages(imageObjects);
          setCurrentTab(1);
        }
        
        setSuccess(`Önizleme başarılı - Görseller bulundu: ${result.data.images?.length ?? 0}`);
      } else {
        setError(result.error || 'Önizleme başarısız');
      }
    } catch (err: any) {
      setError('Önizleme hatası: ' + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleImageSelection = (index: number) => {
    const newImages = [...scrapedImages];
    newImages[index].selected = !newImages[index].selected;
    setScrapedImages(newImages);
  };

  const selectAllImages = (select: boolean) => {
    const newImages = scrapedImages.map(img => ({ ...img, selected: select }));
    setScrapedImages(newImages);
  };

  const handleFullProjectCreation = async () => {
    const validUrls = urls.filter(url => url.trim());
    
    if (validUrls.length === 0) {
      setError('En az bir geçerli URL girin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProgress(0);

      for (let i = 0; i < validUrls.length; i++) {
        const url = validUrls[i];
        setProgress((i / validUrls.length) * 50);

        const response = await fetch('/api/scraper/scrape-and-create-project', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            url: url,
            selectors: customSelectors,
            projectSettings: {
              ...projectSettings,
              projectName: projectSettings.projectName || `Scraped Project ${Date.now()}`
            },
            downloadImages: downloadImages,
            imageSettings: {
              maxSize: maxImageSize * 1024 * 1024,
              quality: imageQuality,
              optimize: optimizeImages,
              selectedImages: scrapedImages.filter(img => img.selected).map(img => img.url)
            }
          })
        });

        const result = await response.json();
        
        if (result.success) {
          setBulkResults(prev => [...prev, result]);
        }
        
        setProgress(50 + ((i + 1) / validUrls.length) * 50);
      }

      setSuccess(`✅ Tamamlandı! ${bulkResults.length} proje oluşturuldu`);
      onSuccess();
      
    } catch (err: any) {
      setError('Proje oluşturma hatası: ' + err.message);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const handleImageDownload = async () => {
    const selectedImages = scrapedImages.filter(img => img.selected);
    
    if (selectedImages.length === 0) {
      setError('En az bir görsel seçin');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/scraper/download-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          imageUrls: selectedImages.map(img => img.url),
          productId: previewData?.ledCode || 'manual',
          productName: previewData?.name || 'scraped-product'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const updatedImages = scrapedImages.map(img => {
          const downloaded = result.downloadedImages.find((d: any) => d.originalUrl === img.url);
          if (downloaded) {
            return {
              ...img,
              downloaded: true,
              fileName: downloaded.fileName,
              fileSize: downloaded.fileSize
            };
          }
          return img;
        });
        setScrapedImages(updatedImages);
        
        setSuccess(`📸 ${result.summary.downloaded} görsel indirildi (${(result.summary.totalSize / 1024 / 1024).toFixed(1)} MB)`);
      } else {
        setError('Görsel indirme başarısız');
      }
      
    } catch (err: any) {
      setError('Görsel indirme hatası: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartDisplay />
          <Typography variant="h6">Advanced Product Scraper 🕷️📸</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Web sitelerinden ürün bilgilerini ve görsellerini otomatik çekin, projeler oluşturun
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ width: '100%' }}>
          {/* Alert'ler */}
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Progress Bar */}
          {loading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                İşlem devam ediyor... ({progress.toFixed(0)}%)
              </Typography>
            </Box>
          )}

          {/* Tabs */}
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="URLs & Settings" icon={<Settings />} />
            <Tab label={`Images (${scrapedImages.length})`} icon={<PhotoLibrary />} />
            <Tab label="Project Settings" icon={<Folder />} />
            <Tab label="Preview" icon={<Preview />} />
          </Tabs>

          {/* Tab 0: URLs & Settings - Grid'ler Box ile değiştirildi */}
          <TabPanel value={currentTab} index={0}>
            <Stack spacing={3}>
              {/* Site Şablonu ve Görsel Ayarları */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Site Şablonu</Typography>
                      <FormControl fullWidth>
                        <InputLabel>Hazır Şablon</InputLabel>
                        <Select
                          value={selectedPreset}
                          onChange={(e) => setSelectedPreset(e.target.value)}
                        >
                          <MenuItem value="generic">Genel Şablon</MenuItem>
                          <MenuItem value="trendyol">Trendyol</MenuItem>
                          <MenuItem value="hepsiburada">Hepsiburada</MenuItem>
                          <MenuItem value="custom-led">LED Özel Siteler</MenuItem>
                        </Select>
                      </FormControl>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Görsel Ayarları</Typography>
                      <Stack spacing={1}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={downloadImages}
                              onChange={(e) => setDownloadImages(e.target.checked)}
                            />
                          }
                          label="Görselleri İndir"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={optimizeImages}
                              onChange={(e) => setOptimizeImages(e.target.checked)}
                            />
                          }
                          label="Görselleri Optimize Et"
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* URL Listesi */}
              <Box sx={{ width: '100%' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>URL Listesi</Typography>
                    <Stack spacing={2}>
                      {urls.map((url, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            label={`URL ${index + 1}`}
                            value={url}
                            onChange={(e) => updateURL(index, e.target.value)}
                            placeholder="https://example.com/product/..."
                          />
                          {urls.length > 1 && (
                            <Button 
                              color="error" 
                              onClick={() => removeURL(index)}
                            >
                              Sil
                            </Button>
                          )}
                        </Box>
                      ))}
                      <Button onClick={addURL} variant="outlined">
                        + URL Ekle
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Stack>
          </TabPanel>

          {/* Tab 1: Images */}
          <TabPanel value={currentTab} index={1}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Bulunan Görseller ({scrapedImages.filter(img => img.selected).length}/{scrapedImages.length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      onClick={() => selectAllImages(true)}
                    >
                      Tümünü Seç
                    </Button>
                    <Button 
                      size="small" 
                      onClick={() => selectAllImages(false)}
                    >
                      Hiçbirini Seçme
                    </Button>
                    <Button 
                      variant="contained"
                      startIcon={<CloudDownload />}
                      onClick={handleImageDownload}
                      disabled={scrapedImages.filter(img => img.selected).length === 0}
                    >
                      Seçilenleri İndir
                    </Button>
                  </Box>
                </Box>

                {scrapedImages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PhotoLibrary sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Henüz görsel bulunamadı
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Önce URL'yi scrape edin
                    </Typography>
                  </Box>
                ) : (
                  <ImageList variant="masonry" cols={3} gap={8}>
                    {scrapedImages.map((image, index) => (
                      <ImageListItem key={index}>
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={image.url}
                            alt={`Scraped ${index + 1}`}
                            loading="lazy"
                            style={{
                              width: '100%',
                              borderRadius: '8px',
                              filter: image.selected ? 'none' : 'grayscale(100%)',
                              opacity: image.selected ? 1 : 0.5
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.png';
                            }}
                          />
                          
                          <Checkbox
                            checked={image.selected}
                            onChange={() => toggleImageSelection(index)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              borderRadius: '4px'
                            }}
                          />
                          
                          {image.downloaded && (
                            <Chip
                              label="İndirildi"
                              color="success"
                              size="small"
                              icon={<CheckCircle />}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8
                              }}
                            />
                          )}
                          
                          <ImageListItemBar
                            title={`Görsel ${index + 1}`}
                            subtitle={image.fileName ? 
                              `${image.fileName} (${(image.fileSize! / 1024).toFixed(1)} KB)` : 
                              'Henüz indirilmedi'
                            }
                            actionIcon={
                              <Tooltip title="Büyüt">
                                <Button
                                  size="small"
                                  onClick={() => window.open(image.url, '_blank')}
                                >
                                  <ZoomIn sx={{ color: 'white' }} />
                                </Button>
                              </Tooltip>
                            }
                          />
                        </Box>
                      </ImageListItem>
                    ))}
                  </ImageList>
                )}

                {/* Image Settings */}
                {scrapedImages.length > 0 && (
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>Görsel İşleme Ayarları</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                          <Typography gutterBottom>Max Dosya Boyutu (MB)</Typography>
                          <Select
                            fullWidth
                            value={maxImageSize}
                            onChange={(e) => setMaxImageSize(e.target.value as number)}
                          >
                            <MenuItem value={0.5}>0.5 MB</MenuItem>
                            <MenuItem value={1}>1 MB</MenuItem>
                            <MenuItem value={2}>2 MB</MenuItem>
                            <MenuItem value={5}>5 MB</MenuItem>
                            <MenuItem value={10}>10 MB</MenuItem>
                          </Select>
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                          <Typography gutterBottom>JPEG Kalitesi (%)</Typography>
                          <Select
                            fullWidth
                            value={imageQuality}
                            onChange={(e) => setImageQuality(e.target.value as number)}
                          >
                            <MenuItem value={60}>60% (Küçük)</MenuItem>
                            <MenuItem value={75}>75% (Orta)</MenuItem>
                            <MenuItem value={85}>85% (İyi)</MenuItem>
                            <MenuItem value={95}>95% (Yüksek)</MenuItem>
                          </Select>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 2: Project Settings - Grid'ler Box ile değiştirildi */}
          <TabPanel value={currentTab} index={2}>
            <Stack spacing={3}>
              {/* Otomatik Proje ve LED Ayarları */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Otomatik Proje Oluşturma</Typography>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={projectSettings.createProject}
                            onChange={(e) => setProjectSettings(prev => ({ 
                              ...prev, 
                              createProject: e.target.checked 
                            }))}
                          />
                        }
                        label="After Effects Projesi Oluştur"
                      />
                      
                      {projectSettings.createProject && (
                        <Stack spacing={2} sx={{ mt: 2 }}>
                          <TextField
                            fullWidth
                            label="Proje Adı"
                            value={projectSettings.projectName}
                            onChange={(e) => setProjectSettings(prev => ({ 
                              ...prev, 
                              projectName: e.target.value 
                            }))}
                            placeholder="Otomatik isim verilecek"
                          />
                          
                          <FormControl fullWidth>
                            <InputLabel>Proje Tipi</InputLabel>
                            <Select
                              value={projectSettings.projectType}
                              onChange={(e) => setProjectSettings(prev => ({ 
                                ...prev, 
                                projectType: e.target.value as any 
                              }))}
                            >
                              <MenuItem value="shoe">👟 Shoe Project</MenuItem>
                              <MenuItem value="logo">🏷️ Logo Project</MenuItem>
                              <MenuItem value="mixed">🎬 Mixed Project</MenuItem>
                            </Select>
                          </FormControl>
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>LED Veritabanı Kaydı</Typography>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={projectSettings.createLED}
                            onChange={(e) => setProjectSettings(prev => ({ 
                              ...prev, 
                              createLED: e.target.checked 
                            }))}
                          />
                        }
                        label="LED Kaydı Oluştur"
                      />
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Boyut bilgileri bulunan ürünler için otomatik LED panel kaydı oluşturulacak
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* İşlem Özeti */}
              <Box sx={{ width: '100%' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>İşlem Özeti</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Link color={urls.filter(u => u.trim()).length > 0 ? 'success' : 'disabled'} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${urls.filter(u => u.trim()).length} URL scrape edilecek`}
                        />
                      </ListItem>
                      
                      {downloadImages && (
                        <ListItem>
                          <ListItemIcon>
                            <Image color={scrapedImages.filter(img => img.selected).length > 0 ? 'success' : 'disabled'} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${scrapedImages.filter(img => img.selected).length} görsel indirilecek`}
                          />
                        </ListItem>
                      )}
                      
                      {projectSettings.createProject && (
                        <ListItem>
                          <ListItemIcon>
                            <Folder color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="After Effects projeleri oluşturulacak"
                          />
                        </ListItem>
                      )}
                      
                      {projectSettings.createLED && (
                        <ListItem>
                          <ListItemIcon>
                            <SmartDisplay color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="LED panel kayıtları oluşturulacak"
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Box>
            </Stack>
          </TabPanel>

          {/* Tab 3: Preview - Grid'ler Box ile değiştirildi */}
          <TabPanel value={currentTab} index={3}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {previewData && (
                  <Box sx={{ flex: '2 1 600px', minWidth: 600 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <Preview sx={{ mr: 1 }} />
                          Scraping Önizlemesi
                        </Typography>
                        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, maxHeight: 400, overflow: 'auto' }}>
                          <Typography variant="body2" component="pre">
                            {JSON.stringify(previewData, null, 2)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                      <Stack spacing={2}>
                        <Button
                          variant="contained"
                          startIcon={previewLoading ? <CircularProgress size={20} /> : <Preview />}
                          onClick={handleAdvancedPreview}
                          disabled={previewLoading || !urls[0]}
                          fullWidth
                        >
                          {previewLoading ? 'Scraping...' : 'Smart Preview'}
                        </Button>

                        {scrapedImages.length > 0 && (
                          <Button
                            variant="outlined"
                            startIcon={<PhotoLibrary />}
                            onClick={() => setCurrentTab(1)}
                            fullWidth
                          >
                            View Images ({scrapedImages.length})
                          </Button>
                        )}

                        <Button
                          variant="outlined"
                          startIcon={<Settings />}
                          onClick={() => setCurrentTab(2)}
                          fullWidth
                        >
                          Project Settings
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* Sonuçlar */}
              {bulkResults.length > 0 && (
                <Box sx={{ width: '100%' }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        İşlem Sonuçları ({bulkResults.length})
                      </Typography>
                      <List>
                        {bulkResults.map((result, index) => (
                          <ListItem key={index} divider>
                            <ListItemIcon>
                              <CheckCircle color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary={result.productData?.name || `URL ${index + 1}`}
                              secondary={
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {result.projectId && (
                                    <Chip label={`Proje: ${result.projectId}`} size="small" />
                                  )}
                                  {result.ledId && (
                                    <Chip label={`LED: ${result.ledId}`} size="small" />
                                  )}
                                  {result.downloadedImages?.length > 0 && (
                                    <Chip 
                                      label={`${result.downloadedImages.length} görsel`} 
                                      size="small" 
                                      color="info" 
                                    />
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Stack>
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
        
        <Button 
          onClick={handleAdvancedPreview}
          disabled={previewLoading || !urls[0]}
          startIcon={previewLoading ? <CircularProgress size={20} /> : <Preview />}
        >
          Smart Preview
        </Button>
        
        <Button
          onClick={handleFullProjectCreation}
          variant="contained"
          disabled={loading || urls.filter(u => u.trim()).length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <SmartDisplay />}
        >
          {loading ? 'Creating...' : 'Create Full Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedScraperDialog;