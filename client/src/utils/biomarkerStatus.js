// Utility functions for biomarker status computation

/**
 * Parse numeric value from strings like "40 mg/dL", "5.6 %", "107 mL/min/1.73m²"
 */
export const parseValue = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return null;
  
  const str = String(value).trim();
  const match = str.match(/[-+]?\d+\.?\d*/);
  return match ? parseFloat(match[0]) : null;
};

/**
 * Parse reference range from various formats:
 * "0.7 - 1.3 mg/dL", "13 - 43", "< 100", ">= 60", "59 -", "7.5 - %"
 * Returns { min, max } where either can be null
 */
export const parseRange = (range) => {
  if (!range) return { min: null, max: null };
  
  // Handle object format { min, max, unit }
  if (typeof range === 'object' && !Array.isArray(range)) {
    return {
      min: parseValue(range.min),
      max: parseValue(range.max)
    };
  }
  
  const str = String(range).trim();
  
  // Handle "< X" or "<X" format (max only)
  if (str.match(/^[<≤]/)) {
    const val = parseValue(str.replace(/^[<≤]\s*/, ''));
    return { min: null, max: val };
  }
  
  // Handle "> X" or ">=X" format (min only)
  if (str.match(/^[>≥]/)) {
    const val = parseValue(str.replace(/^[>≥=]\s*/, ''));
    return { min: val, max: null };
  }
  
  // Handle "X - Y" format
  if (str.includes('-')) {
    const parts = str.split('-').map(p => p.trim());
    const min = parseValue(parts[0]);
    const max = parseValue(parts[1]);
    return { min, max };
  }
  
  // Single value - treat as max
  const val = parseValue(str);
  return { min: null, max: val };
};

/**
 * Compute biomarker status based on value and reference range
 * Returns: "NORMAL", "HIGH", "LOW", "CRITICAL", or "RANGE MISSING"
 */
export const computeStatus = (value, referenceRange) => {
  const numValue = parseValue(value);
  if (numValue === null) return 'RANGE MISSING';
  
  const { min, max } = parseRange(referenceRange);
  
  // No usable range
  if (min === null && max === null) {
    return 'RANGE MISSING';
  }
  
  // Both min and max exist
  if (min !== null && max !== null) {
    if (numValue < min) return 'LOW';
    if (numValue > max) return 'HIGH';
    return 'NORMAL';
  }
  
  // Only max exists
  if (max !== null) {
    if (numValue > max) return 'HIGH';
    return 'NORMAL';
  }
  
  // Only min exists
  if (min !== null) {
    if (numValue < min) return 'LOW';
    return 'NORMAL';
  }
  
  return 'RANGE MISSING';
};

/**
 * Get color for status badge
 */
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'normal': return 'success';
    case 'high': return 'error';
    case 'low': return 'info';
    case 'critical': return 'error';
    case 'range missing': return 'default';
    default: return 'default';
  }
};
