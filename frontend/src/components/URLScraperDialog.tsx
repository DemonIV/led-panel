import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
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
  LinearProgress
} from '@mui/material';
import {
  ExpandMore,
  Link,
  CheckCircle,
  Error,
  Preview,
  Download,
  Settings
} from '@mui/icons-material';

interface URLScraperDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const URLScraperDialog: React.FC<URLScraperDialogProps> = ({ open, onClose, onSuccess }) => {
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
  const [previewData, setPreviewData] = useState<any>(null);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [autoImport, setAutoImport] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [presets, setPresets] = useState<any>({});
  const [progress, setProgress] = useState(0);

  // Presets yükle
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

  // Preset değiştiğinde selector'ları güncelle
  useEffect(() => {
    if (selectedPreset && presets[selectedPreset]) {
      setCustomSelectors(presets[selectedPreset]);
    }
  }, [selectedPreset, presets]);

  // URL ekle/çıkar
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

  // Önizleme
  const handlePreview = async () => {
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
        setSuccess('Önizleme başarılı');
      } else {
        setError(result.error || 'Önizleme başarısız');
      }
    } catch (err: any) {
      setError('Önizleme hatası: ' + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Toplu scraping
  const handleBulkScraping = async () => {
    const validUrls = urls.filter(url => url.trim());
    
    if (validUrls.length === 0) {
      setError('En az bir geçerli URL girin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProgress(0);

      const response = await fetch('/api/scraper/scrape-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          urls: validUrls,
          selectors: customSelectors,
          autoImport: autoImport
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setBulkResults(result.results);
        setSuccess(`✅ Tamamlandı! ${result.summary.successful}/${result.summary.total} başarılı${autoImport ? `, ${result.summary.imported} otomatik import` : ''}`);
        
        if (autoImport && result.summary.imported > 0) {
          onSuccess(); // LED listesini yenile
        }
      } else {
        setError(result.error || 'Scraping başarısız');
      }
    } catch (err: any) {
      setError('Scraping hatası: ' + err.message);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Link />
          <Typography variant="h6">URL Product Scraper 🕷️</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Web sitelerinden ürün bilgilerini otomatik olarak çekin
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Alert'ler */}
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Progress Bar */}
          {loading && (
            <Box sx={{ width: '100%' }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                URLs işleniyor... ({progress}%)
              </Typography>
            </Box>
          )}

          {/* Preset Seçimi */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Site Şablonu Seçin</Typography>
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

          {/* URL Listesi */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>URL Listesi</Typography>
              {urls.map((url, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
            </CardContent>
          </Card>

          {/* Özel Seçiciler */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings />
                <Typography>Özel CSS Seçiciler (Advanced)</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="İsim Seçici"
                  value={customSelectors.name}
                  onChange={(e) => setCustomSelectors(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="h1, .product-title"
                />
                <TextField
                  label="En (Width) Seçici"
                  value={customSelectors.width}
                  onChange={(e) => setCustomSelectors(prev => ({ ...prev, width: e.target.value }))}
                  placeholder=".width, [data-width]"
                />
                <TextField
                  label="Boy (Height) Seçici"
                  value={customSelectors.height}
                  onChange={(e) => setCustomSelectors(prev => ({ ...prev, height: e.target.value }))}
                  placeholder=".height, [data-height]"
                />
                <TextField
                  label="Fiyat Seçici"
                  value={customSelectors.price}
                  onChange={(e) => setCustomSelectors(prev => ({ ...prev, price: e.target.value }))}
                  placeholder=".price, .fiyat"
                />
                <TextField
                  label="Mağaza Seçici"
                  value={customSelectors.store}
                  onChange={(e) => setCustomSelectors(prev => ({ ...prev, store: e.target.value }))}
                  placeholder=".store, .magaza"
                />
                <TextField
                  label="Şehir Seçici"
                  value={customSelectors.city}
                  onChange={(e) => setCustomSelectors(prev => ({ ...prev, city: e.target.value }))}
                  placeholder=".city, .location"
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Ayarlar */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>İşlem Ayarları</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoImport}
                    onChange={(e) => setAutoImport(e.target.checked)}
                  />
                }
                label="Otomatik Veritabanına Import Et"
              />
              <Typography variant="body2" color="text.secondary">
                Başarılı scraping sonuçları direkt LED veritabanına eklenecek
              </Typography>
            </CardContent>
          </Card>

          {/* Önizleme */}
          {previewData && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Preview sx={{ mr: 1 }} />
                  Scraping Önizlemesi
                </Typography>
                <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" component="pre">
                    {JSON.stringify(previewData, null, 2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Sonuçlar */}
          {bulkResults.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Scraping Sonuçları ({bulkResults.length})
                </Typography>
                <List>
                  {bulkResults.map((result, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {result.width && result.height ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Error color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.ledCode || result.name || `URL ${index + 1}`}
                        secondary={
                          result.width && result.height 
                            ? `${result.width}x${result.height} - ${result.type} ${result.imported ? '✅ İmport edildi' : ''}`
                            : 'Boyut bilgisi bulunamadı'
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
        <Button 
          onClick={handlePreview}
          disabled={previewLoading || !urls[0]}
          startIcon={previewLoading ? <CircularProgress size={20} /> : <Preview />}
        >
          Önizleme
        </Button>
        <Button
          onClick={handleBulkScraping}
          variant="contained"
          disabled={loading || urls.filter(u => u.trim()).length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <Download />}
        >
          {loading ? 'İşleniyor...' : 'Scraping Başlat'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default URLScraperDialog;