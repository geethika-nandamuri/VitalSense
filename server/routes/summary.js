const express = require('express');
const Report = require('../models/Report');
const Biomarker = require('../models/Biomarker');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Generate doctor-ready summary - DOCTOR ONLY
router.get('/', authenticate, requireRole('DOCTOR'), async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Fetch all reports for patient, sorted by date
    const reports = await Report.find({ 
      userId: userId,
      status: 'completed',
      reportDate: { $exists: true, $ne: null }
    }).sort({ reportDate: 1 });
    
    // Validation: Need at least 2 reports
    if (reports.length < 2) {
      return res.json({
        summaryAvailable: false,
        message: 'Need at least 2 reports with valid dates to generate summary'
      });
    }
    
    // Get latest report and check biomarker count
    const latestReport = reports[reports.length - 1];
    const latestBiomarkers = await Biomarker.find({ 
      reportId: latestReport._id,
      value: { $type: 'number' }
    });
    
    // Validation: Latest report needs at least 6 numeric biomarkers
    if (latestBiomarkers.length < 6) {
      return res.json({
        summaryAvailable: false,
        message: 'Latest report needs at least 6 numeric biomarkers to generate summary'
      });
    }
    
    // Get all biomarkers for trend analysis
    const allBiomarkers = await Biomarker.find({ 
      userId: userId,
      value: { $type: 'number' }
    }).sort({ date: 1 });
    
    // Group biomarkers by testName
    const biomarkersByTest = {};
    allBiomarkers.forEach(b => {
      if (!biomarkersByTest[b.testName]) {
        biomarkersByTest[b.testName] = [];
      }
      biomarkersByTest[b.testName].push({
        value: b.value,
        unit: b.unit,
        status: b.status,
        date: b.date,
        reportId: b.reportId.toString()
      });
    });
    
    // 1. Critical Abnormalities (from latest report)
    const criticalAbnormalities = latestBiomarkers
      .filter(b => b.status === 'high' || b.status === 'low' || b.status === 'critical')
      .map(b => ({
        testName: b.testName,
        value: b.value,
        unit: b.unit,
        status: b.status
      }));
    
    // 2. Persistent Issues (abnormal in >= 2 reports)
    const persistentIssues = [];
    Object.keys(biomarkersByTest).forEach(testName => {
      const readings = biomarkersByTest[testName];
      if (readings.length >= 2) {
        const abnormalCount = readings.filter(r => r.status !== 'normal').length;
        if (abnormalCount >= 2) {
          const latest = readings[readings.length - 1];
          persistentIssues.push({
            testName,
            value: latest.value,
            unit: latest.unit,
            status: latest.status,
            occurrences: abnormalCount
          });
        }
      }
    });
    
    // 3. Trends (increasing/decreasing/stable)
    const trends = [];
    Object.keys(biomarkersByTest).forEach(testName => {
      const readings = biomarkersByTest[testName];
      if (readings.length >= 2) {
        // Check unit consistency
        const units = [...new Set(readings.map(r => r.unit))];
        if (units.length === 1) {
          const first = readings[0].value;
          const last = readings[readings.length - 1].value;
          const change = ((last - first) / first) * 100;
          
          if (Math.abs(change) > 10) {
            trends.push({
              testName,
              direction: change > 0 ? 'increasing' : 'decreasing',
              changePercent: Math.abs(change).toFixed(1),
              dataPoints: readings.length
            });
          }
        }
      }
    });
    
    // 4. Improvements (abnormal → normal)
    const improvements = [];
    Object.keys(biomarkersByTest).forEach(testName => {
      const readings = biomarkersByTest[testName];
      if (readings.length >= 2) {
        const previous = readings[readings.length - 2];
        const latest = readings[readings.length - 1];
        if (previous.status !== 'normal' && latest.status === 'normal') {
          improvements.push({
            testName,
            previousValue: previous.value,
            currentValue: latest.value,
            unit: latest.unit
          });
        }
      }
    });
    
    // Generate 5-point summary with confidence levels
    const summaryItems = [];
    
    // 1. Critical Abnormalities
    if (criticalAbnormalities.length > 0) {
      const top3 = criticalAbnormalities.slice(0, 3);
      summaryItems.push({
        title: 'Critical Abnormalities',
        text: `Latest report shows ${criticalAbnormalities.length} abnormal value(s): ${top3.map(a => `${a.testName} ${a.value} ${a.unit} (${a.status})`).join(', ')}${criticalAbnormalities.length > 3 ? ` and ${criticalAbnormalities.length - 3} more` : ''}.`,
        confidence: 'High',
        data: criticalAbnormalities
      });
    } else {
      summaryItems.push({
        title: 'Critical Abnormalities',
        text: 'No critical abnormalities detected in latest report. All values within acceptable ranges.',
        confidence: 'High',
        data: []
      });
    }
    
    // 2. Persistent Issues
    if (persistentIssues.length > 0) {
      const confidence = persistentIssues.some(p => p.occurrences >= 3) ? 'High' : 'Medium';
      summaryItems.push({
        title: 'Persistent Issues',
        text: `${persistentIssues.length} biomarker(s) showing persistent abnormalities across multiple reports: ${persistentIssues.slice(0, 2).map(p => `${p.testName} (${p.occurrences} occurrences)`).join(', ')}. Requires clinical attention.`,
        confidence,
        data: persistentIssues
      });
    } else {
      summaryItems.push({
        title: 'Persistent Issues',
        text: 'No persistent abnormalities detected. Abnormal values appear to be isolated incidents.',
        confidence: 'Medium',
        data: []
      });
    }
    
    // 3. Notable Trends
    if (trends.length > 0) {
      const confidence = trends.some(t => t.dataPoints >= 3) ? 'High' : 'Medium';
      const significantTrends = trends.filter(t => parseFloat(t.changePercent) > 20);
      if (significantTrends.length > 0) {
        summaryItems.push({
          title: 'Notable Trends',
          text: `Significant trends observed: ${significantTrends.slice(0, 2).map(t => `${t.testName} ${t.direction} by ${t.changePercent}%`).join(', ')}. Monitor closely.`,
          confidence,
          data: trends
        });
      } else {
        summaryItems.push({
          title: 'Notable Trends',
          text: `Moderate trends detected in ${trends.length} biomarker(s). Changes are within expected variation range.`,
          confidence: 'Medium',
          data: trends
        });
      }
    } else {
      summaryItems.push({
        title: 'Notable Trends',
        text: 'No significant trends detected. Values remain relatively stable over time.',
        confidence: 'Low',
        data: []
      });
    }
    
    // 4. Improvements
    if (improvements.length > 0) {
      summaryItems.push({
        title: 'Improvements',
        text: `Positive changes observed: ${improvements.map(i => `${i.testName} normalized from ${i.previousValue} to ${i.currentValue} ${i.unit}`).join(', ')}. Patient showing positive response.`,
        confidence: 'High',
        data: improvements
      });
    } else {
      summaryItems.push({
        title: 'Improvements',
        text: 'No significant improvements from previous abnormal values. Continue monitoring current treatment approach.',
        confidence: 'Medium',
        data: []
      });
    }
    
    // 5. Follow-up Recommendations
    const recommendations = [];
    if (persistentIssues.length > 0) {
      recommendations.push('Consider follow-up testing for persistent abnormalities');
    }
    if (trends.some(t => parseFloat(t.changePercent) > 30)) {
      recommendations.push('Clinical review recommended for significant trend changes');
    }
    if (criticalAbnormalities.some(a => a.status === 'critical')) {
      recommendations.push('Immediate clinical attention required for critical values');
    }
    if (recommendations.length === 0) {
      recommendations.push('Continue routine monitoring');
      recommendations.push('Maintain current health management approach');
    }
    
    const confidence = recommendations.length > 2 ? 'High' : recommendations.length === 2 ? 'Medium' : 'Low';
    summaryItems.push({
      title: 'Follow-up Recommendations',
      text: recommendations.join('. ') + '.',
      confidence,
      data: recommendations
    });
    
    res.json({
      summaryAvailable: true,
      summary: summaryItems,
      metadata: {
        totalReports: reports.length,
        dateRange: {
          first: reports[0].reportDate,
          latest: latestReport.reportDate
        },
        totalBiomarkers: latestBiomarkers.length,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;