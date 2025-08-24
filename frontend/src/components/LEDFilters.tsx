// frontend/src/components/LEDFilters.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,

  Autocomplete
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Clear,
  Search
} from '@mui/icons-material';
import { LED } from '../types/led.types';
import { Magaza } from '../types/magaza.types';

interface FilterOptions {
  searchText: string;
  selectedTips: string[];
  selectedDurum: string[];
  selectedSehirler: string[];
  selectedMagazalar: string[];
  aspectRatioRange: [number, number];
  boyutRange: [number, number];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface LEDFiltersProps {
  onFilterChange: (filteredLeds: LED[]) => void;
  allLeds: LED[];
  allMagazalar: Magaza[];
}

const LEDFilters: React.FC<LEDFiltersProps> = ({ onFilterChange, allLeds, allMagazalar }) => {
  const [expanded, setExpanded] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null); // ✅ YENİ
  const [filters, setFilters] = useState<FilterOptions>({
    searchText: '',
    selectedTips: [],
    selectedDurum: [],
    selectedSehirler: [],
    selectedMagazalar: [],
    aspectRatioRange: [0, 10],
    boyutRange: [0, 10000000],
    dateRange: {
      startDate: '',
      endDate: ''
    }
  });

  // Benzersiz değerleri çıkar
  const uniqueTips = Array.from(new Set(allLeds.map(led => led.tip).filter(Boolean)));
  const uniqueDurum = Array.from(new Set(allLeds.map(led => led.ozelDurum).filter(Boolean)));
  const uniqueSehirler = Array.from(new Set(allMagazalar.map(magaza => magaza.sehir)));
  
  // Aspect ratio ve boyut aralıklarını hesapla
  const aspectRatios = allLeds.map(led => led.aspect || 0).filter(aspect => aspect > 0);
  const boyutlar = allLeds.map(led => (led.enPx || 0) * (led.boyPx || 0)).filter(boyut => boyut > 0);
  
  const minAspectRatio = Math.min(...aspectRatios, 0);
  const maxAspectRatio = Math.max(...aspectRatios, 10);
  const minBoyut = Math.min(...boyutlar, 0);
  const maxBoyut = Math.max(...boyutlar, 10000000);

  // Filtreleme fonksiyonu
  const applyFilters = (currentFilters: FilterOptions) => {
    let filtered = [...allLeds];

    // Metin araması
    if (currentFilters.searchText) {
  const searchLower = currentFilters.searchText.toLowerCase().trim();
  
  if (searchLower.length >= 1) { // ✅ En az 1 karakter yazmaya başladığında filtrele
    filtered = filtered.filter(led => {
      // LED kodu tam eşleşme veya başlangıç eşleşmesi
      const ledKoduMatch = led.ledKodu.toLowerCase().includes(searchLower);
      
      // Notlar içinde arama (varsa)
      const notlarMatch = led.notlar ? led.notlar.toLowerCase().includes(searchLower) : false;
      
      // Tip içinde arama (varsa)
      const tipMatch = led.tip ? led.tip.toLowerCase().includes(searchLower) : false;
      
      // Mağaza adında arama (varsa)
      const magazaMatch = led.magazaAdi ? led.magazaAdi.toLowerCase().includes(searchLower) : false;
      
      // Şehir adında arama (varsa)
      const sehirMatch = led.sehir ? led.sehir.toLowerCase().includes(searchLower) : false;
      
      // Boyut araması (1920x1080 formatında)
      const boyutText = `${led.enPx}x${led.boyPx}`;
      const boyutMatch = boyutText.includes(searchLower);
      
      // Herhangi birinde eşleşme varsa göster
      return ledKoduMatch || notlarMatch || tipMatch || magazaMatch || sehirMatch || boyutMatch;
    });
  }
}

    // Tip filtresi
    if (currentFilters.selectedTips.length > 0) {
      filtered = filtered.filter(led => 
        led.tip && currentFilters.selectedTips.includes(led.tip)
      );
    }

    // Durum filtresi
    if (currentFilters.selectedDurum.length > 0) {
      filtered = filtered.filter(led => 
        led.ozelDurum && currentFilters.selectedDurum.includes(led.ozelDurum)
      );
    }

    // Şehir filtresi
    if (currentFilters.selectedSehirler.length > 0) {
      filtered = filtered.filter(led => 
        led.sehir && currentFilters.selectedSehirler.includes(led.sehir)
      );
    }

    // Mağaza filtresi
    if (currentFilters.selectedMagazalar.length > 0) {
      filtered = filtered.filter(led => 
        led.magazaAdi && currentFilters.selectedMagazalar.includes(led.magazaAdi)
      );
    }

    // Aspect ratio filtresi
    filtered = filtered.filter(led => {
      const aspect = led.aspect || 0;
      return aspect >= currentFilters.aspectRatioRange[0] && 
             aspect <= currentFilters.aspectRatioRange[1];
    });

    // Boyut filtresi
    filtered = filtered.filter(led => {
      const boyut = (led.enPx || 0) * (led.boyPx || 0);
      return boyut >= currentFilters.boyutRange[0] && 
             boyut <= currentFilters.boyutRange[1];
    });

    // Tarih filtresi
    if (currentFilters.dateRange.startDate && currentFilters.dateRange.endDate) {
      filtered = filtered.filter(led => {
        if (!led.createdAt) return false;
        const ledDate = new Date(led.createdAt);
        const startDate = new Date(currentFilters.dateRange.startDate);
        const endDate = new Date(currentFilters.dateRange.endDate);
        return ledDate >= startDate && ledDate <= endDate;
      });
    }

    onFilterChange(filtered);
  };

  // Filtreleri sıfırla
  const clearFilters = () => {
    const clearedFilters: FilterOptions = {
      searchText: '',
      selectedTips: [],
      selectedDurum: [],
      selectedSehirler: [],
      selectedMagazalar: [],
      aspectRatioRange: [minAspectRatio, maxAspectRatio],
      boyutRange: [minBoyut, maxBoyut],
      dateRange: {
        startDate: '',
        endDate: ''
      }
    };
    setFilters(clearedFilters);
    applyFilters(clearedFilters);
  };

  // Filter değişikliklerini uygula
    // ✅ GELİŞTİRİLMİŞ handleFilterChange
  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Eğer searchText değişikliği ise debounce uygula
    if (newFilters.searchText !== undefined) {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
      
      const timer = setTimeout(() => {
        applyFilters(updatedFilters);
      }, 300); // 300ms bekle
      
      setSearchDebounceTimer(timer);  ///burda bir hata var
    } else {
      // Diğer filtreler için direkt uygula
      applyFilters(updatedFilters);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  // Component mount olduğunda aspect ratio ve boyut range'lerini ayarla
  useEffect(() => {
    if (aspectRatios.length > 0 && boyutlar.length > 0) {
      setFilters(prev => ({
        ...prev,
        aspectRatioRange: [minAspectRatio, maxAspectRatio],
        boyutRange: [minBoyut, maxBoyut]
      }));
    }
  }, [allLeds]);

  // Aktif filtre sayısını hesapla
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchText) count++;
    if (filters.selectedTips.length > 0) count++;
    if (filters.selectedDurum.length > 0) count++;
    if (filters.selectedSehirler.length > 0) count++;
    if (filters.selectedMagazalar.length > 0) count++;
    if (filters.aspectRatioRange[0] !== minAspectRatio || filters.aspectRatioRange[1] !== maxAspectRatio) count++;
    if (filters.boyutRange[0] !== minBoyut || filters.boyutRange[1] !== maxBoyut) count++;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Ana arama ve açma/kapama */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="LED kodu, not, tip, mağaza veya şehirde ara..."
            value={filters.searchText}
            onChange={(e) => handleFilterChange({ searchText: e.target.value })}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setExpanded(!expanded)}
            sx={{ minWidth: 120 }}
          >
            Filtreler {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
          
          {activeFilterCount > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Clear />}
              onClick={clearFilters}
            >
              Temizle
            </Button>
          )}
        </Box>

        {/* Aktif filtre chip'leri */}
        {activeFilterCount > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {filters.selectedTips.map(tip => (
              <Chip
                key={tip}
                label={`Tip: ${tip}`}
                onDelete={() => handleFilterChange({ 
                  selectedTips: filters.selectedTips.filter(t => t !== tip) 
                })}
                size="small"
                color="primary"
              />
            ))}
            {filters.selectedDurum.map(durum => (
              <Chip
                key={durum}
                label={`Durum: ${durum}`}
                onDelete={() => handleFilterChange({ 
                  selectedDurum: filters.selectedDurum.filter(d => d !== durum) 
                })}
                size="small"
                color="secondary"
              />
            ))}
            {filters.selectedSehirler.map(sehir => (
              <Chip
                key={sehir}
                label={`Şehir: ${sehir}`}
                onDelete={() => handleFilterChange({ 
                  selectedSehirler: filters.selectedSehirler.filter(s => s !== sehir) 
                })}
                size="small"
                color="success"
              />
            ))}
          </Box>
        )}

        {/* Gelişmiş filtreler */}
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Gelişmiş Filtreler</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {/* Tip Seçimi */}
              <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                <FormControl fullWidth>
                  <InputLabel>LED Tipleri</InputLabel>
                  <Select
                    multiple
                    value={filters.selectedTips}
                    onChange={(e) => handleFilterChange({ selectedTips: e.target.value as string[] })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {uniqueTips.map(tip => (
                      <MenuItem key={tip} value={tip}>{tip}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Durum Seçimi */}
              <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                <FormControl fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    multiple
                    value={filters.selectedDurum}
                    onChange={(e) => handleFilterChange({ selectedDurum: e.target.value as string[] })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {uniqueDurum.map(durum => (
                      <MenuItem key={durum} value={durum}>{durum}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Şehir Seçimi */}
              <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                <Autocomplete
                  multiple
                  options={uniqueSehirler}
                  value={filters.selectedSehirler}
                  onChange={(event, newValue) => handleFilterChange({ selectedSehirler: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} label="Şehirler" placeholder="Şehir seçin" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                />
              </Box>

              {/* Mağaza Seçimi */}
              <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                <Autocomplete
                  multiple
                  options={allMagazalar.map(m => m.magazaAdi)}
                  value={filters.selectedMagazalar}
                  onChange={(event, newValue) => handleFilterChange({ selectedMagazalar: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} label="Mağazalar" placeholder="Mağaza seçin" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                />
              </Box>

              {/* Aspect Ratio Aralığı */}
              <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                <Typography gutterBottom>Aspect Ratio Aralığı</Typography>
                <Slider
                  value={filters.aspectRatioRange}
                  onChange={(event, newValue) => 
                    handleFilterChange({ aspectRatioRange: newValue as [number, number] })
                  }
                  valueLabelDisplay="auto"
                  min={minAspectRatio}
                  max={maxAspectRatio}
                  step={0.1}
                  marks={[
                    { value: minAspectRatio, label: minAspectRatio.toFixed(1) },
                    { value: maxAspectRatio, label: maxAspectRatio.toFixed(1) }
                  ]}
                />
              </Box>

              {/* Boyut Aralığı */}
              <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                <Typography gutterBottom>Alan Aralığı (px²)</Typography>
                <Slider
                  value={filters.boyutRange}
                  onChange={(event, newValue) => 
                    handleFilterChange({ boyutRange: newValue as [number, number] })
                  }
                  valueLabelDisplay="auto"
                  min={minBoyut}
                  max={maxBoyut}
                  step={100000}
                  valueLabelFormat={(value) => `${(value / 1000000).toFixed(1)}M`}
                  marks={[
                    { value: minBoyut, label: `${(minBoyut / 1000000).toFixed(1)}M` },
                    { value: maxBoyut, label: `${(maxBoyut / 1000000).toFixed(1)}M` }
                  ]}
                />
              </Box>

              {/* Tarih Aralığı */}
              <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                <TextField
                  fullWidth
                  label="Başlangıç Tarihi"
                  type="date"
                  value={filters.dateRange.startDate}
                  onChange={(e) => handleFilterChange({ 
                    dateRange: { ...filters.dateRange, startDate: e.target.value }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                <TextField
                  fullWidth
                  label="Bitiş Tarihi"
                  type="date"
                  value={filters.dateRange.endDate}
                  onChange={(e) => handleFilterChange({ 
                    dateRange: { ...filters.dateRange, endDate: e.target.value }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default LEDFilters;