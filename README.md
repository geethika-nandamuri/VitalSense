# VitalSense: Intelligent Lab Report Analyzer & Lifestyle Coach

An AI-powered platform that digitizes lab reports, explains biomarkers in plain English, and provides science-backed diet and lifestyle suggestions while tracking improvement trends over time.

## Features

- 📄 **OCR & Extraction**: Upload PDF/Image lab reports and extract structured biomarker data using Gemini Vision
- 📊 **Time-Series Tracking**: Store readings as time-series and visualize trends
- 🔍 **Biomarker Explanation**: RAG-powered explanations of what each biomarker means
- 🥗 **Nutrition & Lifestyle Recommendations**: Personalized, science-backed suggestions
- 📈 **Trend Analysis**: Detect rising/declining trends and forecast improvements
- 📋 **Doctor-Ready Summaries**: Auto-generate concise summaries for healthcare providers

## Tech Stack

- **Frontend**: React.js with Chart.js/Recharts
- **Backend**: Node.js + Express
- **Database**: MongoDB (user data, time-series biomarkers)
- **Vector DB**: Pinecone (biomarker definitions, nutrition guidelines)
- **AI Model**: Gemini 1.5 Flash (Vision OCR, extraction, synthesis)

## Setup

1. Install dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
- Copy `.env.example` to `.env` in both `server/` and `client/` directories
- Add your MongoDB connection string, Pinecone API key, and Gemini API key

3. Run the application:
```bash
npm run dev
```

## Important Disclaimer

⚠️ **This tool provides wellness suggestions and does not replace medical advice. Always consult with healthcare professionals for medical decisions.**

## Project Structure

```
VitalSense/
├── server/          # Backend Express API
├── client/          # React frontend
└── README.md
```
