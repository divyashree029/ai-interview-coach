# 🚀 AI-Powered Interview Preparation Assistant

A comprehensive platform to help job seekers optimize their resumes and practice for interviews using Google's Gemini AI.

## ✨ Features

- **ATS Resume Analysis**: Upload your resume and job description to get an ATS score and improvement tips.
- **Interactive Mock Interviews**: Practice with an AI interviewer that provides real-time feedback and follow-up questions.
- **Voice Recognition**: Answer interview questions using your voice for a more realistic practice session.
- **Personalized Learning Path**: Receive a tailored career roadmap based on your resume and interview performance.
- **Session History**: Track your progress over time with a full history of your resume analyses.
- **Secure Authentication**: User accounts with JWT-based authentication.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Vanilla CSS (Glassmorphism design)
- **Backend**: Python, Flask, SQLAlchemy (SQLite)
- **AI**: Google Gemini 1.5 Flash
- **Deployment**: Ready for Cloud Run / Docker

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### 2. Setup
1. Clone the repository.
2. Create a `.env` file in the root directory (use `.env.example` as a template):
   ```env
   GEMINI_API_KEY=your_key_here
   SECRET_KEY=your_secret_key
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Install Frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### 3. Running the App
Use the provided PowerShell script (Windows):
```powershell
.\run_app.ps1
```
Or start manually:
- **Backend**: `python main.py`
- **Frontend**: `cd frontend && npm run dev`

## 📁 Project Structure

- `main.py`: Flask backend with Gemini integration.
- `frontend/`: React application.
- `instance/`: SQLite database storage.
- `requirements.txt`: Python package list.

## 📄 License
MIT
