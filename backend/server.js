const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routes import
const ledRoutes = require('./routes/ledRoutes');
const authRoutes = require('./routes/authRoutes');
const magazaRoutes = require('./routes/magazaRoutes');
const aspectRulesRoutes = require('./routes/aspectRulesRoutes'); // ✅ Aktif edildi
const cleanupRoutes = require('./routes/cleanupRoutes'); // ✅ Aktif edildi
const reportsRoutes = require('./routes/reportsRoutes');
const projectRoutes = require('./routes/projectRoutes');
const assetRoutes = require('./routes/assetRoutes');
const templateRoutes = require('./routes/templateRoutes');


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'LED Panel API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/leds', ledRoutes);
app.use('/api/magazalar', magazaRoutes);
app.use('/api/aspect-rules', aspectRulesRoutes); // ✅ Aktif edildi
app.use('/api/cleanup', cleanupRoutes); // ✅ Aktif edildi
app.use('/api/reports', reportsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/templates', templateRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});