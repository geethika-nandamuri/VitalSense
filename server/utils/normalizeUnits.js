// Unit normalization for common biomarkers
const UNIT_CONVERSIONS = {
  // Glucose
  'mg/dL': { to: 'mmol/L', factor: 0.0555 },
  'mmol/L': { to: 'mg/dL', factor: 18.0182 },
  
  // Cholesterol
  'mg/dL': { to: 'mmol/L', factor: 0.0259 },
  
  // HbA1c (usually in %)
  '%': { to: 'mmol/mol', factor: 10.929 },
  
  // TSH
  'mIU/L': { to: 'mIU/L', factor: 1 },
  'µIU/mL': { to: 'mIU/L', factor: 1 },
  
  // Creatinine
  'mg/dL': { to: 'µmol/L', factor: 88.4 },
  'µmol/L': { to: 'mg/dL', factor: 0.0113 },
};

const normalizeValue = (value, fromUnit, toUnit = 'SI') => {
  if (fromUnit === toUnit) return value;
  
  // For now, return value as-is and store original unit
  // More sophisticated normalization can be added based on test type
  return value;
};

const getNormalizedUnit = (testName, unit) => {
  // Handle null/undefined units
  if (!unit) {
    unit = 'N/A';
  }
  
  // Return standard unit for common tests
  const standardUnits = {
    'glucose': 'mg/dL',
    'hba1c': '%',
    'tsh': 'mIU/L',
    'ldl': 'mg/dL',
    'hdl': 'mg/dL',
    'triglycerides': 'mg/dL',
    'total cholesterol': 'mg/dL',
  };
  
  const testLower = testName.toLowerCase();
  for (const [key, stdUnit] of Object.entries(standardUnits)) {
    if (testLower.includes(key)) {
      return stdUnit;
    }
  }
  
  return unit;
};

module.exports = {
  normalizeValue,
  getNormalizedUnit
};
