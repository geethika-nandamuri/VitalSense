const { getGeminiVisionModel } = require('../config/gemini');
const fs = require('fs').promises;
const path = require('path');
let pdfPoppler = null;

// Optional dependency for PDF -> image conversion
try {
  // eslint-disable-next-line global-require
  pdfPoppler = require('pdf-poppler');
} catch (_) {
  pdfPoppler = null;
}

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
      return extractedData;
    }
    
    // Fallback: try to parse the entire response as JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse OCR response as JSON');
    }
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw error;
  }
};

async function convertPdfToPngImages(pdfPath) {
  if (!pdfPoppler) {
    throw new Error('pdf-poppler is not installed');
  }

  const outDir = path.join(path.dirname(pdfPath), `${path.basename(pdfPath)}_pages`);
  await fs.mkdir(outDir, { recursive: true });

  const outPrefix = 'page';
  const options = {
    format: 'png',
    out_dir: outDir,
    out_prefix: outPrefix,
    // scale impacts resolution; 1024 is pdf-poppler default, but keep explicit
    scale: 1024,
  };

  await pdfPoppler.convert(pdfPath, options);

  // pdf-poppler outputs files like: page-1.png, page-2.png, ...
  const files = await fs.readdir(outDir);
  const pageFiles = files
    .filter((f) => /^page-\d+\.png$/i.test(f))
    .sort((a, b) => {
      const na = Number(a.match(/-(\d+)\.png$/i)?.[1] || 0);
      const nb = Number(b.match(/-(\d+)\.png$/i)?.[1] || 0);
      return na - nb;
    })
    .map((f) => path.join(outDir, f));

  if (pageFiles.length === 0) {
    throw new Error('No PNG pages were generated from the PDF');
  }

  return pageFiles;
}

const extractBiomarkersFromPDF = async (pdfPath) => {
  // Convert PDF pages to PNG images before sending to the model.
  try {
    const pageImages = await convertPdfToPngImages(pdfPath);

    const allResults = [];
    for (const imagePath of pageImages) {
      // Process each page image with Gemini Vision
      // eslint-disable-next-line no-await-in-loop
      const pageResults = await extractBiomarkersFromImage(imagePath, 'image/png');
      if (Array.isArray(pageResults)) {
        allResults.push(...pageResults);
      }
    }

    return allResults;
  } catch (error) {
    console.error('PDF conversion failed. Please convert PDF to images first.', error.message);
    throw new Error(
      'PDF conversion failed. Please convert PDF to images first. Error: ' + error.message
    );
  }
};

module.exports = {
  extractBiomarkersFromImage,
  extractBiomarkersFromPDF
};
