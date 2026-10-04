const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: 'Hindi',
        enum: ['Hindi', 'English']
    },
    // Raw text extracted from the file
    extractedText: {
        type: String,
        default: ''
    },
    // Full AI explanation from Gemini
    aiResult: {
        summary:      { type: String, default: '' },
        keyFindings:  { type: [String], default: [] },
        normalValues: { type: [String], default: [] },
        abnormalValues: { type: [String], default: [] },
        advice:       { type: String, default: '' },
        disclaimer:   { type: String, default: '' }
    },
    status: {
        type: String,
        default: 'uploaded',
        enum: ['uploaded', 'processing', 'done', 'failed']
    },
    errorMessage: {
        type: String,
        default: ''
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', reportSchema);
