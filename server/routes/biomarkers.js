const express = require('express');
const Biomarker = require('../models/Biomarker');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { retrieveBiomarkerInfo } = require('../services/ragService');

const router = express.Router();

// Get all biomarkers for user (time-series)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { testName } = req.query;
    
    const query = { userId: req.userId || null };
    if (testName) {
      query.testName = new RegExp(testName, 'i');
    }
    
    const biomarkers = await Biomarker.find(query)
      .sort({ date: 1, testName: 1 })
      .populate('reportId', 'fileName reportDate');
    
    res.json({ biomarkers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get biomarkers grouped by test name
router.get('/grouped', optionalAuth, async (req, res) => {
  try {
    const biomarkers = await Biomarker.find({ userId: req.userId || null })
      .sort({ date: 1 });
    
    // Group by test name
    const grouped = {};
    biomarkers.forEach(b => {
      if (!grouped[b.testName]) {
        grouped[b.testName] = [];
      }
      grouped[b.testName].push({
        id: b._id,
        value: b.value,
        unit: b.unit,
        normalizedValue: b.normalizedValue,
        normalizedUnit: b.normalizedUnit,
        status: b.status,
        referenceRange: b.referenceRange,
        date: b.date
      });
    });
    
    res.json({ grouped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get explanation for a biomarker
router.get('/:testName/explanation', optionalAuth, async (req, res) => {
  try {
    const { testName } = req.params;
    const explanation = await retrieveBiomarkerInfo(testName);
    res.json(explanation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest values for all tests
router.get('/latest', optionalAuth, async (req, res) => {
  try {
    const biomarkers = await Biomarker.aggregate([
      { $match: { userId: req.userId || null } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$testName',
          latestValue: { $first: '$value' },
          latestUnit: { $first: '$unit' },
          latestStatus: { $first: '$status' },
          latestDate: { $first: '$date' },
          referenceRange: { $first: '$referenceRange' }
        }
      }
    ]);
    
    res.json({ biomarkers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
