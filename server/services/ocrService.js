const { callWithRetryAndFallback } = require('../config/gemini');
const fs = require('fs').promises;
const path = require('path');
const { pdf } = require('pdf-to-img');

/**
 * Extract biomarkers from an image file (JPEG/PNG).
 */
const extractBiomarkersFromImage = async (imagePath, mimeType) => {
  try {
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

    const text = await callWithRetryAndFallback([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType || 'image/jpeg'
        }
      }
    ]);
    
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
 * Convert a PDF into one or more images (PNG) before sending to the model.
 * Uses pdf-to-img (pdfjs-dist) — no native dependencies required.
 */
const convertPdfToImages = async (pdfPath) => {
  try {
    const fileName = path.basename(pdfPath, '.pdf');
    const outputDir = path.join(path.dirname(pdfPath), `${fileName}_pages`);
    await fs.mkdir(outputDir, { recursive: true });

    const pdfBuffer = await fs.readFile(pdfPath);
    const doc = await pdf(pdfBuffer, { scale: 2.0 });

    const imageFiles = [];
    let pageNum = 1;
    for await (const pageImage of doc) {
      const outPath = path.join(outputDir, `page_${pageNum}.png`);
      await fs.writeFile(outPath, pageImage);
      imageFiles.push(outPath);
      pageNum++;
    }

    if (imageFiles.length === 0) {
      throw new Error('No images generated from PDF');
    }

    console.log(`PDF converted: ${imageFiles.length} page(s) → ${outputDir}`);
    return imageFiles;
  } catch (error) {
    console.error('PDF conversion error:', error.message);
    throw new Error(`PDF conversion failed: ${error.message}`);
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
