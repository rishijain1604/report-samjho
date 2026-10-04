const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend
app.use(express.static(path.join(__dirname, '../')));

// ── CONNECT TO MONGODB ──
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch(err => console.log('❌ MongoDB Connection Error:', err.message));

// ── CHECK GEMINI KEY ──
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('⚠️  WARNING: GEMINI_API_KEY is not set in .env file!');
    console.warn('⚠️  Get your free key from: https://aistudio.google.com/app/apikey');
} else {
    console.log('✅ Gemini API Key loaded!');
}

// ── ROUTES ──
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/contact', require('./routes/contact'));

// ── ROOT ──
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ── 404 ──
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ── ERROR HANDLER ──
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`\n🚀 ReportSamjho Server → http://localhost:${PORT}`);
    console.log(`📦 MongoDB → ${process.env.MONGO_URI}`);
    console.log(`🤖 Gemini AI → ${process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? 'Ready' : 'NOT SET'}\n`);
});
