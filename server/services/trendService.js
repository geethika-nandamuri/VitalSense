const Biomarker = require('../models/Biomarker');
const Report = require('../models/Report');

/**
 * SINGLE SHARED TREND BUILDER
 * Used by BOTH patient and doctor endpoints to ensure 100% consistency
 * 
 * @param {ObjectId} userId - Patient's user ID
 * @returns {Array} Array of trend objects with consistent structure
 */
async function buildTrendsFromUserId(userId) {
  // Fetch ALL biomarkers for the patient, sorted by date ascending
  const biomarkers = await Biomarker.find({ 
    userId: userId,
    value: { $type: 'number' }
  }).sort({ date: 1 });
  
  // Fetch all reports for this user to get file names
  const reportIds = [...new Set(biomarkers.map(b => b.reportId.toString()))];
  const reports = await Report.find({ _id: { $in: reportIds } });
  const reportMap = {};
  reports.forEach(r => {
    reportMap[r._id.toString()] = r.fileName;
  });
  
  // Group by testName
  const biomarkersByTest = {};
  const dateCountMap = {}; // Track how many reports per date per test
  
  biomarkers.forEach(b => {
    if (!biomarkersByTest[b.testName]) {
      biomarkersByTest[b.testName] = [];
      dateCountMap[b.testName] = {};
    }
    
    const dateStr = b.date.toISOString().split('T')[0];
    dateCountMap[b.testName][dateStr] = (dateCountMap[b.testName][dateStr] || 0) + 1;
    
    const reportName = reportMap[b.reportId.toString()] || `Report ${dateStr}`;
    
    biomarkersByTest[b.testName].push({
      value: b.value,
      unit: b.unit,
      status: b.status,
      date: b.date,
      reportId: b.reportId,
      reportName: reportName
    });
  });
  
  // Build trend output with consistent structure
  const trends = [];
  
  Object.keys(biomarkersByTest).forEach(testName => {
    const readings = biomarkersByTest[testName];
    
    // Check unit consistency
    const units = [...new Set(readings.map(r => r.unit))];
    if (units.length !== 1) {
      // Skip if mixed units
      return;
    }
    
    const unit = units[0];
    
    // Build points array with report metadata
    const points = readings.map(r => ({
      date: r.date.toISOString().split('T')[0], // YYYY-MM-DD
      value: r.value,
      reportId: r.reportId,
      reportName: r.reportName
    }));
    
    // Calculate stats
    let direction = 'stable';
    let changeRate = 0;
    
    if (readings.length >= 2) {
      const first = readings[0].value;
      const last = readings[readings.length - 1].value;
      changeRate = ((last - first) / first) * 100;
      
      if (Math.abs(changeRate) > 5) {
        direction = changeRate > 0 ? 'increasing' : 'decreasing';
      }
    }
    
    trends.push({
      key: testName,
      name: testName,
      unit: unit,
      points: points,
      stats: {
        direction: direction,
        changeRate: parseFloat(changeRate.toFixed(2)),
        dataPoints: readings.length
      }
    });
  });
  
  return trends;
}

module.exports = { buildTrendsFromUserId };
