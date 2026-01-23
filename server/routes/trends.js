const express = require('express');
const Biomarker = require('../models/Biomarker');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get trend analysis for a specific biomarker
router.get('/:testName', authenticate, async (req, res) => {
  try {
    const { testName } = req.params;
    
    const biomarkers = await Biomarker.find({
      userId: req.userId,
      testName: new RegExp(testName, 'i')
    }).sort({ date: 1 });
    
    if (biomarkers.length === 0) {
      return res.status(404).json({ error: 'No data found for this biomarker' });
    }
    
    // Calculate trend
    const values = biomarkers.map(b => b.normalizedValue);
    const dates = biomarkers.map(b => b.date);
    
    // Simple linear regression for trend
    const n = values.length;
    const sumX = dates.reduce((sum, date, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = dates.reduce((sum, date, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const trend = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
    
    // Calculate percentage change
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const percentChange = ((lastValue - firstValue) / firstValue) * 100;
    
    // Get reference range
    const referenceRange = biomarkers[0].referenceRange;
    
    // Determine if trend is good or bad
    let trendAssessment = 'neutral';
    if (referenceRange) {
      const { min, max } = referenceRange;
      const latestStatus = biomarkers[biomarkers.length - 1].status;
      
      if (latestStatus === 'high' && trend === 'increasing') {
        trendAssessment = 'concerning';
      } else if (latestStatus === 'high' && trend === 'decreasing') {
        trendAssessment = 'improving';
      } else if (latestStatus === 'low' && trend === 'decreasing') {
        trendAssessment = 'concerning';
      } else if (latestStatus === 'low' && trend === 'increasing') {
        trendAssessment = 'improving';
      } else if (latestStatus === 'normal') {
        trendAssessment = 'stable';
      }
    }
    
    res.json({
      testName,
      dataPoints: biomarkers.map(b => ({
        date: b.date,
        value: b.value,
        normalizedValue: b.normalizedValue,
        unit: b.unit,
        status: b.status
      })),
      trend,
      trendAssessment,
      percentChange: percentChange.toFixed(2),
      referenceRange,
      insights: generateInsights(testName, trend, percentChange, trendAssessment, biomarkers)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trends for all biomarkers
router.get('/', authenticate, async (req, res) => {
  try {
    const biomarkers = await Biomarker.find({ userId: req.userId })
      .sort({ date: 1 });
    
    // Group by test name
    const grouped = {};
    biomarkers.forEach(b => {
      if (!grouped[b.testName]) {
        grouped[b.testName] = [];
      }
      grouped[b.testName].push(b);
    });
    
    // Calculate trends for each
    const trends = Object.keys(grouped).map(testName => {
      const testData = grouped[testName];
      if (testData.length < 2) {
        return {
          testName,
          trend: 'insufficient_data',
          dataPoints: testData.length
        };
      }
      
      const values = testData.map(b => b.normalizedValue);
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const percentChange = ((lastValue - firstValue) / firstValue) * 100;
      
      const slope = (lastValue - firstValue) / testData.length;
      const trend = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
      
      return {
        testName,
        trend,
        percentChange: percentChange.toFixed(2),
        latestValue: lastValue,
        latestStatus: testData[testData.length - 1].status,
        dataPoints: testData.length
      };
    });
    
    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateInsights(testName, trend, percentChange, trendAssessment, biomarkers) {
  const insights = [];
  
  if (biomarkers.length >= 2) {
    const first = biomarkers[0];
    const last = biomarkers[biomarkers.length - 1];
    
    if (trendAssessment === 'improving') {
      insights.push(`${testName} has improved from ${first.value} ${first.unit} to ${last.value} ${last.unit} (${Math.abs(percentChange).toFixed(1)}% change). Your lifestyle modifications appear to be working.`);
    } else if (trendAssessment === 'concerning') {
      insights.push(`${testName} is trending in an unfavorable direction. Consider reviewing your current approach and consulting with a healthcare provider.`);
    } else if (trend === 'stable' && last.status === 'normal') {
      insights.push(`${testName} remains within normal range. Continue maintaining your current healthy habits.`);
    }
  }
  
  return insights;
}

module.exports = router;
