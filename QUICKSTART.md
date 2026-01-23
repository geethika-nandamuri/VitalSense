# VitalSense Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm run install-all
```

### Step 2: Configure Environment

**Server** (`server/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/vitalsense
JWT_SECRET=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

**Client** (`client/.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 3: Start MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
```

### Step 4: Verify Setup (Optional)
```bash
cd server
npm run verify
```

### Step 5: Run Application
```bash
# From root directory
npm run dev
```

This starts:
- ✅ Backend: http://localhost:5000
- ✅ Frontend: http://localhost:3000

## 📋 First Steps

1. **Register** a new account at http://localhost:3000/register
2. **Upload** a lab report image (JPEG/PNG) or PDF
3. **View** extracted biomarkers in the Biomarkers page
4. **Get** personalized recommendations for abnormal values
5. **Track** trends over time
6. **Generate** doctor-ready summary

## 🔑 Get API Keys

### Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy to `server/.env` as `GEMINI_API_KEY`

### MongoDB
- **Local**: Install MongoDB locally
- **Cloud**: Use MongoDB Atlas (free tier available)

### Pinecone (Optional)
- Currently using Gemini for RAG
- Pinecone integration ready for future enhancement

## 🎯 Key Features to Try

1. **Upload Report**: Drag & drop a lab report image
2. **View Biomarkers**: See all extracted test results
3. **Get Explanations**: Click "Explain" on any biomarker
4. **Recommendations**: View personalized suggestions
5. **Trends**: Upload multiple reports to see trends
6. **Summary**: Generate doctor-ready summary

## ⚠️ Important

- **Wellness Disclaimer**: This tool provides wellness suggestions only
- **Not Medical Advice**: Always consult healthcare professionals
- **Test Data**: Use sample lab reports for testing

## 🐛 Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`

**Gemini API Error**
- Verify API key is correct
- Check API quota/limits

**File Upload Fails**
- Check file size (max 10MB)
- Ensure file format is JPEG, PNG, or PDF

## 📚 More Information

- **Detailed Setup**: See `SETUP.md`
- **Project Overview**: See `PROJECT_OVERVIEW.md`
- **API Documentation**: See `SETUP.md` API Endpoints section

---

**Ready to analyze your lab reports! 🎉**
