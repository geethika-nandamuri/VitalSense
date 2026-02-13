# Trend Report Name Feature Implementation

## Overview
This feature adds report names (file/image names) to trend chart points, solving the confusion when multiple reports are uploaded on the same day. The implementation works consistently across both Patient and Doctor dashboards.

## Backend Changes

### 1. Updated Trend Service (`server/services/trendService.js`)
The shared trend builder now includes report metadata in each point:

**Key Changes:**
- Fetches Report documents to get file names
- Maps reportId to fileName for each biomarker
- Includes `reportId` and `reportName` in each trend point

**Updated Response Structure:**
```json
{
  "trends": [
    {
      "key": "Glucose",
      "name": "Glucose",
      "unit": "mg/dL",
      "points": [
        {
          "date": "2024-01-15",
          "value": 95,
          "reportId": "65a1b2c3d4e5f6g7h8i9j0k1",
          "reportName": "blood_test_jan.pdf"
        },
        {
          "date": "2024-01-15",
          "value": 102,
          "reportId": "65a1b2c3d4e5f6g7h8i9j0k2",
          "reportName": "glucose_check.pdf"
        },
        {
          "date": "2024-01-20",
          "value": 98,
          "reportId": "65a1b2c3d4e5f6g7h8i9j0k3",
          "reportName": "weekly_labs.pdf"
        }
      ],
      "stats": {
        "direction": "stable",
        "changeRate": 3.16,
        "dataPoints": 3
      }
    }
  ]
}
```

### 2. Endpoints Using Shared Builder
Both endpoints return the same structure:
- `/api/patient/trends` - Patient dashboard
- `/api/doctor/patient/:patientId/trends` - Doctor dashboard

## Frontend Changes

### 1. Patient Dashboard (`client/src/pages/Trends.jsx`)

**Updated Tooltip:**
- Shows date
- Shows report name (full name)
- Shows value + unit

**Updated X-axis Labels:**
- If all dates are unique → shows date only (e.g., "Jan 15")
- If duplicate dates exist → shows "date • shortName" (e.g., "Jan 15 • blood_test_ja...")
- Report names truncated to 14 characters for readability

**Chart Data Preparation:**
```javascript
const prepareChartData = () => {
  // Detect duplicate dates
  const dateCounts = {};
  selectedTrend.points.forEach(point => {
    const dateStr = new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
  });
  const hasDuplicates = Object.values(dateCounts).some(count => count > 1);

  // Build chart data with conditional labels
  return selectedTrend.points.map(point => {
    const dateStr = new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    const shortName = point.reportName ? point.reportName.substring(0, 14) : '';
    const displayLabel = hasDuplicates && shortName 
      ? `${dateStr} • ${shortName}` 
      : dateStr;

    return {
      date: displayLabel,
      value: point.value,
      reportName: point.reportName,
      reportId: point.reportId
    };
  });
};
```

### 2. Doctor Dashboard (`client/src/pages/DoctorDashboard.jsx`)

**Same implementation as Patient Dashboard:**
- Identical tooltip rendering
- Identical X-axis label logic
- Consistent user experience

## Example Scenarios

### Scenario 1: Unique Dates
**Data:**
- Jan 15: blood_test.pdf (Glucose: 95)
- Jan 20: weekly_labs.pdf (Glucose: 98)
- Jan 25: monthly_check.pdf (Glucose: 92)

**X-axis Labels:**
```
Jan 15 | Jan 20 | Jan 25
```

**Tooltip (hovering Jan 15):**
```
Jan 15
blood_test.pdf
Value (mg/dL): 95
```

### Scenario 2: Duplicate Dates (Multiple Reports Same Day)
**Data:**
- Jan 15: blood_test_morning.pdf (Glucose: 95)
- Jan 15: blood_test_evening.pdf (Glucose: 102)
- Jan 20: weekly_labs.pdf (Glucose: 98)

**X-axis Labels:**
```
Jan 15 • blood_test_mo | Jan 15 • blood_test_ev | Jan 20 • weekly_labs.p
```

**Tooltip (hovering first Jan 15 point):**
```
Jan 15 • blood_test_mo
blood_test_morning.pdf
Value (mg/dL): 95
```

## Performance Considerations

1. **Single Query for Reports**: All reports fetched once per trend request
2. **In-Memory Mapping**: Report ID to name mapping done in memory
3. **No Additional Database Calls**: Frontend receives all data in initial response
4. **Minimal Overhead**: Only adds ~50-100 bytes per trend point

## Data Model

### Report Model (Already Exists)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  fileName: String,        // Original file name
  filePath: String,
  fileType: String,
  reportDate: Date,
  createdAt: Date,
  // ... other fields
}
```

### Biomarker Model (Already Exists)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  reportId: ObjectId,      // Reference to Report
  testName: String,
  value: Number,
  unit: String,
  date: Date,
  // ... other fields
}
```

## Testing Checklist

- [x] Backend returns reportId and reportName in trend points
- [x] Patient dashboard shows report names in tooltips
- [x] Patient dashboard shows smart X-axis labels (date only or date + name)
- [x] Doctor dashboard shows report names in tooltips
- [x] Doctor dashboard shows smart X-axis labels (date only or date + name)
- [x] Both dashboards use same chart logic
- [x] Handles missing report names gracefully (fallback to date)
- [x] Truncates long file names appropriately
- [x] No performance degradation

## Fallback Behavior

If a report is missing or fileName is not available:
- `reportName` defaults to `"Report YYYY-MM-DD"`
- Chart still renders correctly
- No errors thrown

## Browser Compatibility

- Uses standard JavaScript string methods
- Unicode bullet character (•) supported in all modern browsers
- Recharts library handles rendering consistently

## Future Enhancements

1. **Clickable Points**: Click a point to view full report
2. **Report Type Icons**: Show PDF/image icon in tooltip
3. **Hover Preview**: Show mini report preview on hover
4. **Export with Names**: Include report names in CSV export
