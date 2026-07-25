const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db'); // Initialize DB pool and test connection
const authRoutes = require('./routes/authRoutes');
const unitRoutes = require('./routes/unitRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const billRoutes = require('./routes/billRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/events', eventRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
