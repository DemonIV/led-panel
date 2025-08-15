const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routes import
const ledRoutes = require('./routes/ledRoutes');
const authRoutes = require('./routes/authRoutes');
const magazaRoutes = require('./routes/magazaRoutes'); // YENİ
// const aspectRulesRoutes = require('./routes/aspectRulesRoutes');
// //const cleanupRoutes = require('./routes/cleanupRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
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
app.use('/api/magazalar', magazaRoutes); // YENİ
// app.use('/api/aspect-rules', aspectRulesRoutes);
// //app.use('/api/cleanup', cleanupRoutes);
 app.use('/api/reports', reportsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});