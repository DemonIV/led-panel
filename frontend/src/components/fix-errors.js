const fs = require('fs');
const path = require('path');

// Frontend klasör yolu
const frontendPath = './frontend/src/components';

// Düzeltilecek dosyalar
const filesToFix = [
  'TemplateManagement.tsx',
  'RenderQueueManagement.tsx', 
  'AdvancedLEDExport.tsx',
  'AdvancedScraperDialog.tsx'
];

function fixGridIssues(content) {
  // Grid item prop'larını düzelt
  content = content.replace(/<Grid item xs={(\d+)}>/g, '<Grid xs={$1}>');
  content = content.replace(/<Grid item xs={(\d+)} sm={(\d+)}>/g, '<Grid xs={$1} sm={$2}>');
  content = content.replace(/<Grid item xs={(\d+)} md={(\d+)}>/g, '<Grid xs={$1} md={$2}>');
  content = content.replace(/<Grid item xs={(\d+)} sm={(\d+)} md={([^}]+)}>/g, '<Grid xs={$1} sm={$2} md={$3}>');
  
  return content;
}

function fixImports(content) {
  // Grid2 import ekle
  if (content.includes('Grid,') && !content.includes('Grid2')) {
    content = content.replace(
      'import {',
      'import {\n  Grid2 as Grid,'
    );
    content = content.replace('Grid,', '');
  }
  
  // TabPanel import'unu düzelt
  content = content.replace('TabPanel', '');
  content = content.replace(/,\s*,/g, ','); // Boş virgülleri temizle
  
  return content;
}

function fixTypeErrors(content) {
  // includeMetadata property ekle
  content = content.replace(
    'interface ExportFormat {',
    'interface ExportFormat {\n  includeMetadata?: boolean;'
  );
  
  // Boolean MenuItem değerlerini string'e çevir
  content = content.replace('<MenuItem value={true}>', '<MenuItem value="true">');
  content = content.replace('<MenuItem value={false}>', '<MenuItem value="false">');
  
  // Type any hatalarını düzelt
  content = content.replace('(d => d.originalUrl', '(d: any => d.originalUrl');
  
  return content;
}

// Her dosyayı düzelt
filesToFix.forEach(fileName => {
  const filePath = path.join(frontendPath, fileName);
  
  if (fs.existsSync(filePath)) {
    console.log(`Düzeltiliyor: ${fileName}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Düzeltmeleri uygula
    content = fixGridIssues(content);
    content = fixImports(content);
    content = fixTypeErrors(content);
    
    // Dosyayı geri yaz
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${fileName} düzeltildi`);
  } else {
    console.log(`❌ ${fileName} bulunamadı`);
  }
});

console.log('🎉 Tüm düzeltmeler tamamlandı!');