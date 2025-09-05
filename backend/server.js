const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Routes import
const ledRoutes = require('./routes/ledRoutes');
const authRoutes = require('./routes/authRoutes');
const magazaRoutes = require('./routes/magazaRoutes');
const aspectRulesRoutes = require('./routes/aspectRulesRoutes');
const cleanupRoutes = require('./routes/cleanupRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const projectRoutes = require('./routes/projectRoutes');
const assetRoutes = require('./routes/assetRoutes');
const templateRoutes = require('./routes/templateRoutes');
const scraperRoutes = require('./routes/scraperRoutes'); // ✅ YENİ
const renderQueueRoutes = require('./routes/renderQueueRoutes');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// ✅ Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'LED Panel API is running!',
    version: '2.0.0',
    features: [
      'LED Management',
      'Advanced Filtering', 
      'URL Scraping',
      'Project Management',
      'Asset Management', 
      'Export System',
      'Cleanup Tools'
    ]
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/leds', ledRoutes);
app.use('/api/magazalar', magazaRoutes);
app.use('/api/aspect-rules', aspectRulesRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/scraper', scraperRoutes); // ✅ YENİ
app.use('/api/render-queue', renderQueueRoutes);

// ✅ Create uploads directories
const fs = require('fs');
const uploadDirs = ['uploads', 'uploads/assets', 'uploads/csv'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 LED Panel Management System v2.0`);
  console.log(`🔗 http://localhost:${PORT}`);
});