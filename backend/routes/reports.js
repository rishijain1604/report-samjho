const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const protect = require('../middleware/protect');
const { extractText } = require('../services/extractor');
const { analyzeReport } = require('../services/gemini');

// ── MULTER SETUP ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG and PDF files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ── UPLOAD + ANALYZE ──  POST /api/reports/upload
router.post('/upload', protect, upload.single('report'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const { language } = req.body;

        // STEP 1: Save report to DB with status = processing
        const report = await Report.create({
            user: req.user._id,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: req.file.path,
            language: language || 'Hindi',
            status: 'processing'
        });

        // STEP 2: Send immediate response so user sees progress
        res.status(201).json({
            message: 'Report uploaded! Analysis in progress...',
            reportId: report._id,
            status: 'processing'
        });

        // STEP 3: Extract text in background
        console.log('📤 File received:', req.file.originalname);
        let extractedText = '';

        try {
            extractedText = await extractText(req.file.path, req.file.mimetype);
            console.log('✅ Text extracted, length:', extractedText.length, 'characters');
        } catch (extractErr) {
            console.error('❌ Text extraction failed:', extractErr.message);
            await Report.findByIdAndUpdate(report._id, {
                status: 'failed',
                errorMessage: 'Could not read text from file: ' + extractErr.message
            });
            return;
        }

        if (!extractedText || extractedText.length < 20) {
            await Report.findByIdAndUpdate(report._id, {
                status: 'failed',
                errorMessage: 'Not enough text found in the file. Please upload a clearer image or PDF.'
            });
            return;
        }

        // STEP 4: Send to Gemini for analysis
        try {
            console.log('🤖 Sending to Gemini AI...');
            const aiResult = await analyzeReport(extractedText, language || 'Hindi');
            console.log('✅ Gemini analysis complete!');

            await Report.findByIdAndUpdate(report._id, {
                extractedText,
                aiResult,
                status: 'done'
            });

        } catch (aiErr) {
            console.error('❌ Gemini AI failed:', aiErr.message);
            await Report.findByIdAndUpdate(report._id, {
                extractedText,
                status: 'failed',
                errorMessage: 'AI analysis failed: ' + aiErr.message
            });
        }

    } catch (err) {
        console.error('Upload error:', err.message);
        res.status(500).json({ message: 'Upload failed: ' + err.message });
    }
});

// ── CHECK REPORT STATUS ──  GET /api/reports/status/:id
// Frontend polls this every 3 seconds to check if analysis is done
router.get('/status/:id', protect, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not allowed' });
        }

        res.json({
            reportId: report._id,
            status: report.status,
            originalName: report.originalName,
            language: report.language,
            uploadedAt: report.uploadedAt,
            // Only send AI result when done
            aiResult: report.status === 'done' ? report.aiResult : null,
            errorMessage: report.status === 'failed' ? report.errorMessage : null
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ── GET ALL REPORTS ──  GET /api/reports
router.get('/', protect, async (req, res) => {
    try {
        const reports = await Report.find({ user: req.user._id })
            .sort({ uploadedAt: -1 })
            .select('originalName fileType fileSize language status uploadedAt');

        res.json({
            message: 'Reports fetched successfully',
            count: reports.length,
            reports
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ── GET SINGLE REPORT ──  GET /api/reports/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not allowed to view this report' });
        }

        res.json({ report });

    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ── DELETE REPORT ──  DELETE /api/reports/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not allowed to delete this report' });
        }

        if (fs.existsSync(report.filePath)) {
            fs.unlinkSync(report.filePath);
        }

        await Report.findByIdAndDelete(req.params.id);

        res.json({ message: 'Report deleted successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;
