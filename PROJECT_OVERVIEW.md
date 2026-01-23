# VitalSense - Project Overview

## 🎯 Project Summary

VitalSense is an intelligent lab report analyzer and lifestyle coach that digitizes pathology reports, explains biomarkers in plain English, and provides science-backed diet and lifestyle suggestions while tracking improvement trends over time.

## 🏗️ Architecture

### Frontend (React.js)
- **Location**: `client/`
- **Framework**: React 18 with Material-UI
- **Key Libraries**:
  - React Router for navigation
  - Recharts for data visualization
  - Axios for API calls
  - React Dropzone for file uploads

### Backend (Node.js + Express)
- **Location**: `server/`
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **AI Services**:
  - Google Gemini 1.5 Flash (Vision OCR, RAG, Synthesis)
  - Pinecone (Vector DB - optional, currently using Gemini for RAG)

## 📁 Project Structure

```
VitalSense/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React Context (Auth)
│   │   ├── pages/          # Page components
│   │   └── App.js          # Main app component
│   └── package.json
├── server/                 # Express backend
│   ├── config/             # Configuration files
│   │   ├── gemini.js       # Gemini API setup
│   │   └── pinecone.js     # Pinecone setup
│   ├── models/             # MongoDB models
│   │   ├── User.js
│   │   ├── Biomarker.js
│   │   └── Report.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── reports.js
│   │   ├── biomarkers.js
│   │   ├── recommendations.js
│   │   ├── trends.js
│   │   └── summary.js
│   ├── services/           # Business logic
│   │   ├── ocrService.js   # Gemini Vision OCR
│   │   └── ragService.js   # RAG for explanations
│   ├── utils/             # Utility functions
│   │   ├── normalizeUnits.js
│   │   └── referenceRanges.js
│   ├── middleware/         # Express middleware
│   │   └── auth.js
│   ├── uploads/           # Uploaded files storage
│   └── index.js           # Server entry point
├── package.json           # Root package.json
├── README.md
├── SETUP.md
└── PROJECT_OVERVIEW.md
```

## 🔑 Key Features

### 1. OCR & Extraction
- **Technology**: Gemini Vision API
- **Input**: PDF/Image lab reports
- **Output**: Structured JSON with test names, values, units, reference ranges
- **Location**: `server/services/ocrService.js`

### 2. Biomarker Storage
- **Model**: `server/models/Biomarker.js`
- **Features**:
  - Time-series storage
  - Unit normalization
  - Reference range comparison
  - Status detection (normal/low/high/critical)

### 3. RAG System
- **Technology**: Gemini 1.5 Flash (with Pinecone support ready)
- **Purpose**: Biomarker explanations and nutrition guidelines
- **Location**: `server/services/ragService.js`
- **Namespaces** (Pinecone):
  - Biomarker Definitions
  - Nutrition/Intervention Guidelines

### 4. Recommendation Engine
- **Input**: Abnormal biomarkers + user preferences
- **Output**: Personalized nutrition/lifestyle recommendations
- **Personalization**: Based on diet (veg/non-veg), age, conditions, gender
- **Location**: `server/routes/recommendations.js`

### 5. Trend Analysis
- **Features**:
  - Time-series visualization
  - Trend detection (increasing/decreasing/stable)
  - Percentage change calculation
  - Trend assessment (improving/concerning/stable)
- **Location**: `server/routes/trends.js`, `client/src/pages/Trends.js`

### 6. Doctor Summary
- **Output**: 5-point concise summary
- **Includes**:
  - Critical abnormal values
  - Persistent issues
  - Notable trends
  - Improvements
  - Follow-up recommendations
- **Location**: `server/routes/summary.js`

## 🔐 Authentication & Security

- **Method**: JWT (JSON Web Tokens)
- **Password**: bcrypt hashing
- **Middleware**: `server/middleware/auth.js`
- **Routes**: `server/routes/auth.js`

## 📊 Data Models

### User
```javascript
{
  email: String,
  password: String (hashed),
  name: String,
  preferences: {
    diet: String,
    age: Number,
    conditions: [String],
    gender: String
  }
}
```

### Biomarker
```javascript
{
  userId: ObjectId,
  reportId: ObjectId,
  testName: String,
  value: Number,
  unit: String,
  referenceRange: { min, max, unit },
  status: String (normal/low/high/critical),
  date: Date,
  normalizedValue: Number,
  normalizedUnit: String
}
```

### Report
```javascript
{
  userId: ObjectId,
  fileName: String,
  filePath: String,
  fileType: String (pdf/image),
  extractedData: Mixed,
  status: String,
  reportDate: Date
}
```

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/preferences` - Update preferences

### Reports
- `POST /api/reports/upload` - Upload lab report
- `GET /api/reports` - List all reports
- `GET /api/reports/:id` - Get report details

### Biomarkers
- `GET /api/biomarkers` - Get all biomarkers
- `GET /api/biomarkers/grouped` - Grouped by test name
- `GET /api/biomarkers/latest` - Latest values
- `GET /api/biomarkers/:testName/explanation` - RAG explanation

### Recommendations
- `GET /api/recommendations` - All recommendations
- `GET /api/recommendations/:testName` - Specific biomarker

### Trends
- `GET /api/trends` - All trends
- `GET /api/trends/:testName` - Detailed trend analysis

### Summary
- `GET /api/summary` - Doctor-ready summary

## 🛠️ Development Workflow

1. **Setup**: Follow `SETUP.md`
2. **Verify**: Run `npm run verify` in server directory
3. **Develop**: Run `npm run dev` from root
4. **Test**: Upload sample lab report images
5. **Deploy**: Configure production environment variables

## 🔄 Future Enhancements

1. **Enhanced Pinecone Integration**
   - Proper embedding generation
   - Vector similarity search
   - Knowledge base ingestion

2. **PDF Processing**
   - Multi-page PDF support
   - PDF-to-image conversion
   - Better PDF parsing

3. **Email Integration**
   - Nodemailer for doctor summaries
   - Report notifications

4. **Supplement Checker**
   - Compare supplements vs biomarkers
   - Interaction warnings

5. **Advanced Analytics**
   - Predictive forecasting
   - Risk scoring
   - Health score calculation

## ⚠️ Important Notes

### Wellness Disclaimer
This tool provides wellness suggestions and does not replace medical advice. Always consult with healthcare professionals for medical decisions.

### Privacy
- User data stored securely in MongoDB
- Uploaded files stored locally (consider cloud storage for production)
- JWT tokens for secure authentication

### Compliance
- Not a medical device
- Educational/wellness tool only
- HIPAA considerations for production deployment

## 📝 Environment Variables

### Server (.env)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `GEMINI_API_KEY` - Google Gemini API key
- `PINECONE_API_KEY` - Pinecone API key (optional)
- `PORT` - Server port (default: 5000)

### Client (.env)
- `REACT_APP_API_URL` - Backend API URL

## 🧪 Testing

Currently manual testing via UI. Future:
- Unit tests for services
- Integration tests for API
- E2E tests for critical flows

## 📚 Documentation

- `README.md` - Quick start guide
- `SETUP.md` - Detailed setup instructions
- `PROJECT_OVERVIEW.md` - This file
- Inline code comments for complex logic

## 🤝 Contributing

1. Follow existing code structure
2. Add comments for complex logic
3. Update documentation
4. Test thoroughly before committing

---

**Built with ❤️ for better health insights**
