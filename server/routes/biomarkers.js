const express = require('express');
const Biomarker = require('../models/Biomarker');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { retrieveBiomarkerInfo } = require('../services/ragService');
const { buildPatientTrends } = require('../services/trendService');

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

// Get biomarkers grouped by test name - USES SHARED TREND BUILDER
router.get('/grouped', optionalAuth, async (req, res) => {
  try {
    // Use SHARED trend builder for consistency
    const grouped = await buildPatientTrends(req.userId || null);
    
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
