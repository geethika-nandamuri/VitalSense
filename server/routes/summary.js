const express = require('express');
const Biomarker = require('../models/Biomarker');
const { authenticate } = require('../middleware/auth');
const { getGeminiModel } = require('../config/gemini');

const router = express.Router();

// Generate doctor-ready summary
router.get('/', authenticate, async (req, res) => {
  try {
    // Get all biomarkers grouped by test
    const biomarkers = await Biomarker.aggregate([
      { $match: { userId: req.userId } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$testName',
          latestValue: { $first: '$value' },
          latestUnit: { $first: '$unit' },
          latestStatus: { $first: '$status' },
          latestDate: { $first: '$date' },
          referenceRange: { $first: '$referenceRange' },
          history: {
            $push: {
              value: '$value',
              unit: '$unit',
              status: '$status',
              date: '$date'
            }
          }
        }
      }
    ]);
    
    // Identify persistent issues and trends
    const abnormalBiomarkers = biomarkers.filter(b => 
      b.latestStatus !== 'normal'
    );
    
    const persistentIssues = [];
    const trends = [];
    
    biomarkers.forEach(biomarker => {
      if (biomarker.history.length >= 2) {
        const recent = biomarker.history.slice(0, 3); // Last 3 readings
        const allAbnormal = recent.every(h => h.status !== 'normal');
        
        if (allAbnormal && biomarker.latestStatus !== 'normal') {
          persistentIssues.push({
            testName: biomarker._id,
            status: biomarker.latestStatus,
            currentValue: `${biomarker.latestValue} ${biomarker.latestUnit}`,
            duration: `${recent.length} consecutive readings`
          });
        }
        
        // Check for trends
        if (recent.length >= 2) {
          const values = recent.map(h => h.value);
          const isRising = values.every((val, i) => i === 0 || val >= values[i - 1]);
          const isDeclining = values.every((val, i) => i === 0 || val <= values[i - 1]);
          
          if (isRising && biomarker.latestStatus === 'high') {
            trends.push(`${biomarker._id} rising over ${recent.length} months consecutively`);
          } else if (isDeclining && biomarker.latestStatus === 'low') {
            trends.push(`${biomarker._id} declining over ${recent.length} months consecutively`);
          }
        }
      }
    });
    
    // Generate summary using Gemini
    const model = getGeminiModel();
    
    const summaryPrompt = `Generate a concise, doctor-ready 5-point summary of this patient's lab report data.

Abnormal Biomarkers:
${abnormalBiomarkers.map(b => `- ${b._id}: ${b.latestValue} ${b.latestUnit} (${b.latestStatus})`).join('\n')}

Persistent Issues:
${persistentIssues.map(p => `- ${p.testName}: ${p.currentValue} (${p.duration})`).join('\n')}

Trends:
${trends.join('\n')}

Generate exactly 5 bullet points that a doctor would find useful. Be concise and clinical. Focus on:
1. Most critical abnormal values
2. Persistent issues requiring attention
3. Notable trends
4. Any improvements
5. Key recommendations for follow-up

Format as a numbered list.`;

    const result = await model.generateContent(summaryPrompt);
    const response = await result.response;
    const summaryText = response.text();
    
    res.json({
      summary: summaryText,
      abnormalBiomarkers: abnormalBiomarkers.map(b => ({
        testName: b._id,
        value: b.latestValue,
        unit: b.latestUnit,
        status: b.latestStatus,
        date: b.latestDate
      })),
      persistentIssues,
      trends,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
