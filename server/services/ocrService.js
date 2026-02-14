const { getGeminiVisionModel } = require('../config/gemini');
const fs = require('fs').promises;
const path = require('path');
// Using pdf2pic instead of pdf-poppler for Linux compatibility
const pdf2pic = require('pdf2pic');

/**
 * Extract biomarkers from an image file (JPEG/PNG).
 */
const extractBiomarkersFromImage = async (imagePath, mimeType) => {
  try {
    const model = getGeminiVisionModel();
    
    // Read image file
    const imageData = await fs.readFile(imagePath);
    const base64Image = imageData.toString('base64');
    
    const prompt = `You are a medical lab report analyzer. Extract all biomarker/test results from this lab report image.

For each test found, extract:
1. Test name (e.g., "TSH", "LDL Cholesterol", "HbA1c")
2. Value (numeric)
3. Unit (e.g., "mg/dL", "%", "mIU/L")
4. Reference range if provided (min and max values)

Return the results as a JSON array with this exact structure:
[
  {
    "testName": "Test Name",
    "value": 5.5,
    "unit": "mIU/L",
    "referenceRange": {
      "min": 0.4,
      "max": 4.0,
      "unit": "mIU/L"
    }
  }
]

If reference range is not visible, set it to null.
Only extract actual test results, ignore headers, footers, and other text.
Be precise with the test names and values.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType || 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    let jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // Try to find JSON object
      jsonMatch = text.match(/\{[\s\S]*\}/);
    }
    
    if (jsonMatch) {
      const extractedData = JSON.parse(jsonMatch[0]);
      
      // Ensure all extracted data has required fields
      const cleanedData = Array.isArray(extractedData) ? extractedData : [extractedData];
      const validData = cleanedData.map(item => ({
        testName: item.testName || 'Unknown Test',
        value: parseFloat(item.value) || 0,
        unit: item.unit || 'N/A',
        referenceRange: item.referenceRange || null
      })).filter(item => item.testName !== 'Unknown Test' && item.value !== 0);
      
      return validData;
    }
    
    // Fallback: try to parse the entire response as JSON
    try {
      const parsedData = JSON.parse(text);
      const cleanedData = Array.isArray(parsedData) ? parsedData : [parsedData];
      const validData = cleanedData.map(item => ({
        testName: item.testName || 'Unknown Test',
        value: parseFloat(item.value) || 0,
        unit: item.unit || 'N/A',
        referenceRange: item.referenceRange || null
      })).filter(item => item.testName !== 'Unknown Test' && item.value !== 0);
      
      return validData;
    } catch (e) {
      throw new Error('Failed to parse OCR response as JSON');
    }
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw error;
  }
};

/**
 * Convert a PDF into one or more images (JPEG/PNG) before sending to the model.
 */
const convertPdfToImages = async (pdfPath) => {
  try {
    const fileName = path.basename(pdfPath, '.pdf');
    const outputDir = path.join(path.dirname(pdfPath), `${fileName}_pages`);
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Configure pdf2pic for Linux compatibility
    const convert = pdf2pic.fromPath(pdfPath, {
      density: 100,           // Output resolution
      saveFilename: 'page',   // Output filename prefix
      savePath: outputDir,    // Output directory
      format: 'png',          // Output format
      width: 2048,            // Max width
      height: 2048            // Max height
    });
    
    // Convert all pages
    const results = await convert.bulk(-1, { responseType: 'image' });
    
    if (!results || results.length === 0) {
      throw new Error('No images generated from PDF');
    }
    
    // Return array of image file paths
    const imageFiles = results.map(result => result.path);
    
    return imageFiles;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error('PDF conversion failed. Please convert PDF to images first.');
  }
};

const extractBiomarkersFromPDF = async (pdfPath) => {
  try {
    // Convert PDF to images
    const imagePaths = await convertPdfToImages(pdfPath);

    if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
      throw new Error('PDF conversion returned no images.');
    }

    // Process first page for biomarker extraction
    const firstImagePath = imagePaths[0];
    return await extractBiomarkersFromImage(firstImagePath, 'image/png');
  } catch (error) {
    console.error('PDF processing error:', error);
    throw error;
  }
};

module.exports = {
  extractBiomarkersFromImage,
  extractBiomarkersFromPDF
};
