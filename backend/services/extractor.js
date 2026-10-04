const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

// Extract text from PDF
async function extractFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text.trim();
}

// Extract text from image using OCR
async function extractFromImage(filePath) {
    const result = await Tesseract.recognize(filePath, 'eng+hin', {
        logger: m => {
            // Uncomment below line to see OCR progress in terminal
            // console.log('OCR Progress:', m.status, Math.round((m.progress || 0) * 100) + '%');
        }
    });
    return result.data.text.trim();
}

// Main extract function — decides which method to use based on file type
async function extractText(filePath, mimeType) {
    try {
        if (mimeType === 'application/pdf') {
            console.log('📄 Extracting text from PDF...');
            return await extractFromPDF(filePath);
        } else if (mimeType.startsWith('image/')) {
            console.log('🖼️ Extracting text from image using OCR...');
            return await extractFromImage(filePath);
        } else {
            throw new Error('Unsupported file type: ' + mimeType);
        }
    } catch (err) {
        throw new Error('Text extraction failed: ' + err.message);
    }
}

module.exports = { extractText };
