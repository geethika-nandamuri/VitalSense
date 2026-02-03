const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Report = require('../models/Report');
const Biomarker = require('../models/Biomarker');
const { extractBiomarkersFromImage, extractBiomarkersFromPDF } = require('../services/ocrService');
const { getReferenceRange, checkStatus } = require('../utils/referenceRanges');
const { normalizeValue, getNormalizedUnit } = require('../utils/normalizeUnits');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// Upload and process report
router.post('/upload', optionalAuth, upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'image';
    const mimeType = req.file.mimetype;
    
    // Create report record (userId from auth or null)
    const report = new Report({
      userId: req.userId || null,
      fileName,
      filePath,
      fileType,
      status: 'processing'
    });
    await report.save();
    
    // Extract biomarkers using OCR
    let extractedData;
    try {
      if (fileType === 'pdf') {
        extractedData = await extractBiomarkersFromPDF(filePath);
      } else {
        extractedData = await extractBiomarkersFromImage(filePath, mimeType);
      }
      
      // Ensure extractedData is an array
      if (!Array.isArray(extractedData)) {
        extractedData = [extractedData];
      }
      
      // Process and save biomarkers
      const biomarkers = [];
      const reportDate = new Date(); // In production, extract from report
      
      for (const item of extractedData) {
        const { testName, value, unit, referenceRange: itemRange } = item;
        
        if (!testName || value === undefined) continue;
        
        // Ensure unit is not null or undefined
        const biomarkerUnit = unit || 'N/A';
        
        // Get reference range (from item or lookup)
        const refRange = itemRange || getReferenceRange(testName);
        
        // Determine status
        const status = checkStatus(value, refRange);
        
        // Normalize units
        const normalizedUnit = getNormalizedUnit(testName, biomarkerUnit);
        const normalizedValue = normalizeValue(value, biomarkerUnit, normalizedUnit);
        
        const biomarker = new Biomarker({
          userId: req.userId || null,
          reportId: report._id,
          testName,
          value,
          unit: biomarkerUnit,
          referenceRange: refRange ? {
            min: refRange.min,
            max: refRange.max,
            unit: refRange.unit || biomarkerUnit
          } : null,
          status,
          date: reportDate,
          normalizedValue,
          normalizedUnit
        });
        
        await biomarker.save();
        biomarkers.push(biomarker);
      }
      
      // Update report status
      report.status = 'completed';
      report.extractedData = extractedData;
      report.reportDate = reportDate;
      await report.save();
      
      res.json({
        report: {
          id: report._id,
          fileName: report.fileName,
          status: report.status,
          biomarkersCount: biomarkers.length
        },
        biomarkers: biomarkers.map(b => ({
          id: b._id,
          testName: b.testName,
          value: b.value,
          unit: b.unit,
          status: b.status,
          referenceRange: b.referenceRange
        }))
      });
    } catch (error) {
      report.status = 'failed';
      report.errorMessage = error.message;
      await report.save();
      
      // Clean up uploaded file
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Report upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all reports
router.get('/', optionalAuth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.userId || null })
      .sort({ createdAt: -1 })
      .select('-filePath');
    
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single report with biomarkers
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.userId || null
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const biomarkers = await Biomarker.find({ reportId: report._id });
    
    res.json({
      report: {
        ...report.toObject(),
        filePath: undefined // Don't send file path
      },
      biomarkers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete report
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.userId || null
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Delete associated biomarkers
    await Biomarker.deleteMany({ reportId: report._id });
    
    // Delete the report
    await Report.findByIdAndDelete(report._id);
    
    // Clean up uploaded file
    try {
      if (report.filePath) {
        await fs.unlink(report.filePath);
      }
    } catch (unlinkError) {
      console.error('Error deleting file:', unlinkError);
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Report delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
