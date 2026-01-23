const express = require('express');
const Biomarker = require('../models/Biomarker');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { retrieveNutritionGuidelines } = require('../services/ragService');

const router = express.Router();

// Get recommendations for abnormal biomarkers
router.get('/', authenticate, async (req, res) => {
  try {
    // Get user preferences
    const user = await User.findById(req.userId);
    
    // Get latest abnormal biomarkers
    const abnormalBiomarkers = await Biomarker.aggregate([
      { $match: { userId: req.userId, status: { $in: ['low', 'high', 'critical'] } } },
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
    
    // Get recommendations for each abnormal biomarker
    const recommendations = await Promise.all(
      abnormalBiomarkers.map(async (biomarker) => {
        const rec = await retrieveNutritionGuidelines(
          biomarker._id,
          biomarker.latestStatus,
          user.preferences
        );
        
        return {
          testName: biomarker._id,
          currentValue: biomarker.latestValue,
          unit: biomarker.latestUnit,
          status: biomarker.latestStatus,
          date: biomarker.latestDate,
          referenceRange: biomarker.referenceRange,
          recommendations: rec.recommendations
        };
      })
    );
    
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommendations for a specific biomarker
router.get('/:testName', authenticate, async (req, res) => {
  try {
    const { testName } = req.params;
    
    // Get latest value for this test
    const biomarker = await Biomarker.findOne({
      userId: req.userId,
      testName: new RegExp(testName, 'i')
    }).sort({ date: -1 });
    
    if (!biomarker) {
      return res.status(404).json({ error: 'Biomarker not found' });
    }
    
    // Get user preferences
    const user = await User.findById(req.userId);
    
    // Get recommendations
    const recommendations = await retrieveNutritionGuidelines(
      biomarker.testName,
      biomarker.status,
      user.preferences
    );
    
    res.json({
      biomarker: {
        testName: biomarker.testName,
        value: biomarker.value,
        unit: biomarker.unit,
        status: biomarker.status,
        date: biomarker.date,
        referenceRange: biomarker.referenceRange
      },
      recommendations: recommendations.recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
