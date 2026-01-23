# VitalSense Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Gemini API Key (from Google AI Studio)
- Pinecone API Key (optional, for enhanced RAG - currently using Gemini for RAG)

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration

#### Server Environment (.env)

Create `server/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vitalsense
JWT_SECRET=your_jwt_secret_key_here_change_this
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=vitalsense-index
NODE_ENV=development
```

#### Client Environment (.env)

Create `client/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. MongoDB Setup

Make sure MongoDB is running:

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in server/.env with your Atlas connection string
```

### 4. Running the Application

#### Development Mode (Both Server and Client)

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

#### Or Run Separately

**Backend only:**
```bash
cd server
npm run dev
```

**Frontend only:**
```bash
cd client
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/preferences` - Update user preferences

### Reports
- `POST /api/reports/upload` - Upload lab report (multipart/form-data)
- `GET /api/reports` - Get all reports for user
- `GET /api/reports/:id` - Get single report with biomarkers

### Biomarkers
- `GET /api/biomarkers` - Get all biomarkers (time-series)
- `GET /api/biomarkers/grouped` - Get biomarkers grouped by test name
- `GET /api/biomarkers/latest` - Get latest values for all tests
- `GET /api/biomarkers/:testName/explanation` - Get RAG explanation for biomarker

### Recommendations
- `GET /api/recommendations` - Get recommendations for abnormal biomarkers
- `GET /api/recommendations/:testName` - Get recommendations for specific biomarker

### Trends
- `GET /api/trends` - Get trends for all biomarkers
- `GET /api/trends/:testName` - Get detailed trend analysis for specific biomarker

### Summary
- `GET /api/summary` - Generate doctor-ready summary

## Features

### ✅ Implemented

1. **User Authentication** - Register, login, JWT-based auth
2. **Report Upload** - PDF/Image upload with drag & drop
3. **OCR Extraction** - Gemini Vision API for extracting biomarkers
4. **Biomarker Storage** - Time-series storage in MongoDB
5. **Reference Range Checking** - Automatic status detection (normal/low/high/critical)
6. **RAG Explanations** - Biomarker explanations using Gemini
7. **Recommendations** - Personalized nutrition/lifestyle suggestions
8. **Trend Analysis** - Time-series visualization and trend detection
9. **Doctor Summary** - Auto-generated 5-point summaries
10. **User Preferences** - Diet, age, conditions, gender for personalization

### 🔄 Future Enhancements

- Pinecone vector DB integration for enhanced RAG
- Email doctor summaries via Nodemailer
- Supplement checker
- More sophisticated unit normalization
- PDF page extraction and processing
- Enhanced trend forecasting

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI in server/.env
- Verify network connectivity if using Atlas

### Gemini API Errors
- Verify GEMINI_API_KEY is correct
- Check API quota/limits
- Ensure image files are valid format

### File Upload Issues
- Check uploads directory exists (server/uploads/)
- Verify file size limits (10MB default)
- Ensure file format is supported (JPEG, PNG, PDF)

## Security Notes

- Never commit .env files
- Use strong JWT_SECRET in production
- Implement rate limiting in production
- Add CORS restrictions for production
- Use HTTPS in production

## Wellness Disclaimer

⚠️ **Important:** This tool provides wellness suggestions and does not replace medical advice. Always consult with healthcare professionals for medical decisions.
