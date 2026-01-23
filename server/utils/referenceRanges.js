// Common reference ranges for biomarkers
// These are general ranges and may vary by lab/age/gender
const REFERENCE_RANGES = {
  'glucose': { min: 70, max: 100, unit: 'mg/dL' },
  'hba1c': { min: 4.0, max: 5.6, unit: '%' },
  'tsh': { min: 0.4, max: 4.0, unit: 'mIU/L' },
  'ldl': { min: 0, max: 100, unit: 'mg/dL', optimal: 100 },
  'hdl': { min: 40, max: 999, unit: 'mg/dL', optimal: 60 },
  'triglycerides': { min: 0, max: 150, unit: 'mg/dL' },
  'total cholesterol': { min: 0, max: 200, unit: 'mg/dL' },
  'vitamin d': { min: 30, max: 100, unit: 'ng/mL' },
  'uric acid': { min: 3.5, max: 7.2, unit: 'mg/dL' },
  'creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' },
  'hemoglobin': { min: 12, max: 17, unit: 'g/dL' },
  'mchc': { min: 32, max: 36, unit: 'g/dL' },
};

const getReferenceRange = (testName) => {
  const testLower = testName.toLowerCase();
  
  for (const [key, range] of Object.entries(REFERENCE_RANGES)) {
    if (testLower.includes(key)) {
      return range;
    }
  }
  
  return null;
};

const checkStatus = (value, referenceRange) => {
  if (!referenceRange) return 'normal';
  
  const { min, max } = referenceRange;
  
  if (value < min) {
    const deviation = ((min - value) / min) * 100;
    return deviation > 20 ? 'critical' : 'low';
  }
  
  if (value > max) {
    const deviation = ((value - max) / max) * 100;
    return deviation > 20 ? 'critical' : 'high';
  }
  
  return 'normal';
};

module.exports = {
  REFERENCE_RANGES,
  getReferenceRange,
  checkStatus
};
