// frontend/src/components/AdvancedLEDExport.tsx
import React, { useState, useEffect } from 'react';
import {
  
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Stack,
  
} from '@mui/material';
import {
  FilterList,
  Download,
  Settings,
  Preview,
  Code,
  ExpandMore,
  FileCopy
} from '@mui/icons-material';
import { LED } from '../types/led.types';
import { Magaza } from '../types/magaza.types';
import { ledAPI, magazaAPI, reportsAPI } from '../services/api';

interface ExportFilters {
  // Boyut filtreleri
  enPxMin?: number;
  enPxMax?: number;
  boyPxMin?: number;
  boyPxMax?: number;
  aspectRatioMin?: number;
  aspectRatioMax?: number;
  
  // Lokasyon filtreleri
  sehirler: string[];
  magazalar: string[];
  
  // Tip ve durum filtreleri
  tipler: string[];
  durumlar: string[];
  
  // Tarih filtreleri
  startDate?: string;
  endDate?: string;
  
  // Özel filtreler
  hasNotes?: boolean;
  isAssignedToStore?: boolean;
  
  // Export ayarları
  includeImages?: boolean;
  includeMetadata?: boolean;
  groupByType?: boolean;
}

interface ExportFormat {
  includeMetadata?: boolean;
  type: 'JSON' | 'CSV' | 'AE_SCRIPT' | 'XML';
  structure: 'flat' | 'nested' | 'grouped';
  includeSchema?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanelComponent(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`export-tabpanel-${index}`}
      aria-labelledby={`export-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface AdvancedLEDExportProps {
  open: boolean;
  onClose: () => void;
  allLeds: LED[];
  allMagazalar: Magaza[];
}

const AdvancedLEDExport: React.FC<AdvancedLEDExportProps> = ({
  open,
  onClose,
  allLeds,
  allMagazalar
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [filters, setFilters] = useState<ExportFilters>({
    sehirler: [],
    magazalar: [],
    tipler: [],
    durumlar: []
  });
  const [exportFormat, setExportFormat] = useState<ExportFormat>({
    type: 'JSON',
    structure: 'flat'
  });
  const [filteredData, setFilteredData] = useState<LED[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Unique values
  const uniqueSehirler = Array.from(new Set(allMagazalar.map(m => m.sehir)));
  const uniqueTipler = Array.from(new Set(allLeds.map(l => l.tip).filter(Boolean)));
  const uniqueDurumlar = Array.from(new Set(allLeds.map(l => l.ozelDurum).filter(Boolean)));

  // Filtreleme fonksiyonu
  const applyFilters = () => {
    let filtered = [...allLeds];

    // Boyut filtreleri
    if (filters.enPxMin !== undefined) {
      filtered = filtered.filter(led => led.enPx >= filters.enPxMin!);
    }
    if (filters.enPxMax !== undefined) {
      filtered = filtered.filter(led => led.enPx <= filters.enPxMax!);
    }
    if (filters.boyPxMin !== undefined) {
      filtered = filtered.filter(led => led.boyPx >= filters.boyPxMin!);
    }
    if (filters.boyPxMax !== undefined) {
      filtered = filtered.filter(led => led.boyPx <= filters.boyPxMax!);
    }
    if (filters.aspectRatioMin !== undefined && filters.aspectRatioMax !== undefined) {
      filtered = filtered.filter(led => {
        const aspect = led.aspect || 0;
        return aspect >= filters.aspectRatioMin! && aspect <= filters.aspectRatioMax!;
      });
    }

    // Lokasyon filtreleri
    if (filters.sehirler.length > 0) {
      filtered = filtered.filter(led => led.sehir && filters.sehirler.includes(led.sehir));
    }
    if (filters.magazalar.length > 0) {
      filtered = filtered.filter(led => led.magazaAdi && filters.magazalar.includes(led.magazaAdi));
    }

    // Tip ve durum filtreleri
    if (filters.tipler.length > 0) {
      filtered = filtered.filter(led => led.tip && filters.tipler.includes(led.tip));
    }
    if (filters.durumlar.length > 0) {
      filtered = filtered.filter(led => led.ozelDurum && filters.durumlar.includes(led.ozelDurum));
    }

    // Özel filtreler
    if (filters.hasNotes !== undefined) {
      filtered = filtered.filter(led => filters.hasNotes ? led.notlar : !led.notlar);
    }
    if (filters.isAssignedToStore !== undefined) {
      filtered = filtered.filter(led => filters.isAssignedToStore ? led.magazaID : !led.magazaID);
    }

    setFilteredData(filtered);
    generatePreview(filtered);
  };

  // Önizleme oluştur
  const generatePreview = (data: LED[]) => {
    const sampleData = data.slice(0, 5); // İlk 5 kayıt
    
    switch (exportFormat.type) {
      case 'JSON':
        setPreviewData(JSON.stringify(formatForJSON(sampleData), null, 2));
        break;
      case 'AE_SCRIPT':
        setPreviewData(generateAEScript(sampleData));
        break;
      case 'CSV':
        setPreviewData(generateCSVPreview(sampleData));
        break;
      default:
        setPreviewData(JSON.stringify(sampleData, null, 2));
    }
  };

  // JSON formatı
  const formatForJSON = (data: LED[]) => {
    if (exportFormat.structure === 'grouped') {
      const grouped = data.reduce((acc, led) => {
        const key = led.tip || 'Bilinmeyen';
        if (!acc[key]) acc[key] = [];
        acc[key].push(formatLEDForExport(led));
        return acc;
      }, {} as Record<string, any[]>);
      return grouped;
    } else if (exportFormat.structure === 'nested') {
      return {
        metadata: {
          exportDate: new Date().toISOString(),
          totalCount: data.length,
          filters: filters
        },
        data: data.map(formatLEDForExport)
      };
    } else {
      return data.map(formatLEDForExport);
    }
  };

  // LED export formatı
  const formatLEDForExport = (led: LED) => {
    return {
      ledID: led.ledID,
      ledKodu: led.ledKodu,
      dimensions: {
        width: led.enPx,
        height: led.boyPx,
        aspectRatio: led.aspect
      },
      type: led.tip,
      status: led.ozelDurum,
      location: {
        city: led.sehir,
        store: led.magazaAdi,
        storeID: led.magazaID
      },
      notes: led.notlar,
      dates: {
        created: led.createdAt,
        updated: led.updatedAt
      },
      ...(exportFormat.includeMetadata && {
        metadata: {
          area: led.enPx * led.boyPx,
          ratio: (led.enPx / led.boyPx).toFixed(3),
          category: categorizeBySize(led)
        }
      })
    };
  };

  // After Effects Script oluştur
  const generateAEScript = (data: LED[]) => {
    const script = `
// After Effects LED Import Script
// Generated: ${new Date().toLocaleString()}
// Total Items: ${data.length}

var ledData = ${JSON.stringify(data.map(formatLEDForExport), null, 2)};

// Create compositions for each LED
function createLEDCompositions() {
  var project = app.project;
  var folderName = "LED_Import_" + new Date().getTime();
  var folder = project.items.addFolder(folderName);
  
  for (var i = 0; i < ledData.length; i++) {
    var led = ledData[i];
    var compName = led.ledKodu + "_" + led.dimensions.width + "x" + led.dimensions.height;
    
    var comp = project.items.addComp(
      compName,
      led.dimensions.width,
      led.dimensions.height,
      1.0, // pixel aspect ratio
      10.0, // duration
      30 // frame rate
    );
    
    comp.parentFolder = folder;
    
    // Add solid background
    var bgColor = [0.1, 0.1, 0.1]; // Dark gray
    var solidLayer = comp.layers.addSolid(
      bgColor,
      "Background",
      led.dimensions.width,
      led.dimensions.height,
      1.0
    );
    
    // Add text layer with LED info
    var textLayer = comp.layers.addText(led.ledKodu);
    textLayer.name = "LED_Info";
    
    // Position text in center
    textLayer.transform.position.setValue([
      led.dimensions.width / 2,
      led.dimensions.height / 2
    ]);
  }
  
  alert("Created " + ledData.length + " compositions in folder: " + folderName);
}

// Execute the function
createLEDCompositions();
`;
    return script;
  };

  // CSV önizlemesi
  const generateCSVPreview = (data: LED[]) => {
    const headers = ['LED Kodu', 'En (px)', 'Boy (px)', 'Aspect Ratio', 'Tip', 'Durum', 'Şehir', 'Mağaza'];
    const rows = data.map(led => [
      led.ledKodu,
      led.enPx,
      led.boyPx,
      led.aspect || 0,
      led.tip || '',
      led.ozelDurum || '',
      led.sehir || '',
      led.magazaAdi || ''
    ]);
    
    return headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n');
  };

  // Boyuta göre kategori
  const categorizeBySize = (led: LED) => {
    const area = led.enPx * led.boyPx;
    if (area < 500000) return 'small';
    if (area < 2000000) return 'medium';
    return 'large';
  };

  // Export işlemi
  const handleExport = async () => {
    try {
      setLoading(true);
      
      const exportData = formatForJSON(filteredData);
      const fileName = `led_export_${new Date().toISOString().split('T')[0]}`;
      
      if (exportFormat.type === 'JSON') {
        downloadFile(
          JSON.stringify(exportData, null, 2),
          `${fileName}.json`,
          'application/json'
        );
      } else if (exportFormat.type === 'AE_SCRIPT') {
        downloadFile(
          generateAEScript(filteredData),
          `${fileName}_ae_script.jsx`,
          'application/javascript'
        );
      } else if (exportFormat.type === 'CSV') {
        // API üzerinden CSV export
        const response = await reportsAPI.exportToCSV({
          ...filters,
          includeInactive: filters.durumlar.includes('Pasif')
        });
        
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
    } catch (err: any) {
      setError('Export işlemi başarısız: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Dosya indirme yardımcı fonksiyonu
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (open) {
      applyFilters();
    }
  }, [filters, exportFormat]);

  const steps = ['Filtreler', 'Format Seçimi', 'Önizleme', 'Export'];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h5">Gelişmiş LED Export Sistemi 🎯</Typography>
        <Typography variant="body2" color="text.secondary">
          Filtrelenmiş LED verilerini farklı formatlarda export edin
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ width: '100%' }}>
          <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Filtreler" icon={<FilterList />} />
            <Tab label="Format" icon={<Settings />} />
            <Tab label="Önizleme" icon={<Preview />} />
            <Tab label="Script" icon={<Code />} />
          </Tabs>

          {/* Filtreler Tab */}
{/* Filtreler Tab */}
<TabPanelComponent value={currentTab} index={0}>
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {/* Boyut Filtreleri */}
    <Box sx={{ width: '100%' }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Boyut Filtreleri</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
              <TextField
                fullWidth
                label="Min En (px)"
                type="number"
                value={filters.enPxMin || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, enPxMin: e.target.value ? parseInt(e.target.value) : undefined }))}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
              <TextField
                fullWidth
                label="Max En (px)"
                type="number"
                value={filters.enPxMax || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, enPxMax: e.target.value ? parseInt(e.target.value) : undefined }))}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
              <TextField
                fullWidth
                label="Min Boy (px)"
                type="number"
                value={filters.boyPxMin || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, boyPxMin: e.target.value ? parseInt(e.target.value) : undefined }))}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
              <TextField
                fullWidth
                label="Max Boy (px)"
                type="number"
                value={filters.boyPxMax || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, boyPxMax: e.target.value ? parseInt(e.target.value) : undefined }))}
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>

    {/* Lokasyon Filtreleri */}
    <Box sx={{ width: '100%' }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Lokasyon Filtreleri</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
              <FormControl fullWidth>
                <InputLabel>Şehirler</InputLabel>
                <Select
                  multiple
                  value={filters.sehirler}
                  onChange={(e) => setFilters(prev => ({ ...prev, sehirler: e.target.value as string[] }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {uniqueSehirler.map(sehir => (
                    <MenuItem key={sehir} value={sehir}>{sehir}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
              <FormControl fullWidth>
                <InputLabel>Mağazalar</InputLabel>
                <Select
                  multiple
                  value={filters.magazalar}
                  onChange={(e) => setFilters(prev => ({ ...prev, magazalar: e.target.value as string[] }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {allMagazalar.map(magaza => (
                    <MenuItem key={magaza.magazaID} value={magaza.magazaAdi}>
                      {magaza.sehir} - {magaza.magazaAdi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>

    {/* Sonuç */}
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Bulunan Sonuçlar: {filteredData.length} LED
          </Typography>
          {filteredData.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Örnek: {filteredData.slice(0, 3).map(led => led.ledKodu).join(', ')}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  </Box>
</TabPanelComponent>

{/* Format Tab */}
<TabPanelComponent value={currentTab} index={1}>
  <Stack spacing={3}>
    <Box sx={{ width: '100%' }}>
      <FormControl fullWidth>
        <InputLabel>Export Formatı</InputLabel>
        <Select
          value={exportFormat.type}
          onChange={(e) => setExportFormat(prev => ({ ...prev, type: e.target.value as any }))}
        >
          <MenuItem value="JSON">JSON - Web/API kullanımı</MenuItem>
          <MenuItem value="CSV">CSV - Excel/Tablo</MenuItem>
          <MenuItem value="AE_SCRIPT">After Effects Script (.jsx)</MenuItem>
          <MenuItem value="XML">XML - Sistem entegrasyonu</MenuItem>
        </Select>
      </FormControl>
    </Box>
    
    <Box sx={{ width: '100%' }}>
      <FormControl fullWidth>
        <InputLabel>Veri Yapısı</InputLabel>
        <Select
          value={exportFormat.structure}
          onChange={(e) => setExportFormat(prev => ({ ...prev, structure: e.target.value as any }))}
        >
          <MenuItem value="flat">Düz Liste</MenuItem>
          <MenuItem value="nested">Metadata ile</MenuItem>
          <MenuItem value="grouped">Tip Bazlı Gruplama</MenuItem>
        </Select>
      </FormControl>
    </Box>

    <Box sx={{ width: '100%' }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={exportFormat.includeMetadata || false}
            onChange={(e) => setExportFormat(prev => ({ ...prev, includeMetadata: e.target.checked }))}
          />
        }
        label="Ek Metadata Bilgileri Dahil Et"
      />
    </Box>
  </Stack>
</TabPanelComponent>

          {/* Önizleme Tab */}
          <TabPanelComponent value={currentTab} index={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Export Önizlemesi ({filteredData.length} kayıt)
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    maxHeight: 400,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}
                >
                  <pre>{previewData}</pre>
                </Box>
              </CardContent>
            </Card>
          </TabPanelComponent>

          {/* Script Tab */}
          <TabPanelComponent value={currentTab} index={3}>
            <Alert severity="info" sx={{ mb: 2 }}>
              After Effects Script, seçili LED verilerinden otomatik kompozisyonlar oluşturur.
            </Alert>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  After Effects Script (.jsx)
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'grey.900',
                    color: 'white',
                    p: 2,
                    borderRadius: 1,
                    maxHeight: 400,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}
                >
                  <pre>{generateAEScript(filteredData.slice(0, 3))}</pre>
                </Box>
                <Button
                  startIcon={<FileCopy />}
                  onClick={() => navigator.clipboard.writeText(generateAEScript(filteredData))}
                  sx={{ mt: 1 }}
                >
                  Script'i Kopyala
                </Button>
              </CardContent>
            </Card>
          </TabPanelComponent>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<Download />}
          disabled={loading || filteredData.length === 0}
        >
          {loading ? 'Export Ediliyor...' : `Export Et (${filteredData.length} kayıt)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedLEDExport;