import React, { useState, useContext } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import './index.css';
import './App.css';

import LandingPage from './components/LandingPage';
import Hero from './components/Hero';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';
import AuthModal from './components/AuthModal';
import HistorySidebar from './components/HistorySidebar';
import MockInterview from './components/MockInterview';
import LearningPath from './components/LearningPath';
import { analyzeResume } from './services/aiService';
import { AuthProvider, AuthContext } from './context/AuthContext';

function Dashboard({ results, isLoading, handleAnalyze, handleReset, lastResumeText, lastJd }) {
  const navigate = useNavigate();
  
  return (
    <>
      {!results && !isLoading && (
        <>
          <Hero />
          <UploadSection onAnalyze={handleAnalyze} isLoading={isLoading} />
        </>
      )}

      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>Analyzing your resume...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Our AI is comparing your skills with the job description.</p>
        </div>
      )}

      {results && !isLoading && (
        <div className="fade-in">
          <ResultsDashboard results={results} onReset={handleReset} />
          <div className="action-buttons-footer">
            <button className="btn-primary" onClick={() => navigate('/interview')}>
              Practice with Mock Interview
            </button>
            <button className="btn-secondary" onClick={() => navigate('/learning-path')}>
              View Personalized Learning Path
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function AppContent() {
  const { user, logoutState } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastJd, setLastJd] = useState('');
  const [lastResumeText, setLastResumeText] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async (resumeFile, jdText) => {
    setIsLoading(true);
    setResults(null);
    setLastJd(jdText);
    try {
      const data = await analyzeResume(resumeFile, jdText);
      setResults(data);
      if (data.resume_text) {
          setLastResumeText(data.resume_text);
      }
    } catch (error) {
      console.error("Error analyzing resume:", error);
      alert(`Something went wrong: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setLastJd('');
    setLastResumeText('');
  };

  const handleSelectHistory = (item) => {
    setResults({
      atsScore: { score: item.ats_score, feedback: "Loaded from history" },
      interviewQuestions: item.interview_questions,
      prepTricks: item.prep_tricks
    });
    setLastJd(item.job_description);
    setLastResumeText(item.resume_text);
    setShowHistory(false);
    navigate('/dashboard');
  };

  return (
    <div className="app-container">
      <header className="container">
        <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span role="img" aria-label="rocket">🚀</span> ResumeAI
        </Link>
        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-greeting">Hi, {user.username}</span>
              <button className="btn-secondary" onClick={() => setShowHistory(true)}>
                History
              </button>
              <button className="btn-outline" onClick={logoutState}>
                Log Out
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setShowAuth(true)}>
              Log In
            </button>
          )}
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={
            <Dashboard 
              results={results} 
              isLoading={isLoading} 
              handleAnalyze={handleAnalyze} 
              handleReset={handleReset}
              lastResumeText={lastResumeText}
              lastJd={lastJd}
            />
          } />
          <Route path="/interview" element={
            <MockInterview 
              resumeText={lastResumeText} 
              jobDescription={lastJd} 
              onBack={() => navigate('/dashboard')} 
            />
          } />
          <Route path="/learning-path" element={
            <LearningPath onBack={() => navigate('/dashboard')} />
          } />
        </Routes>
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <HistorySidebar 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        onSelectItem={handleSelectHistory}
      />
      <footer className="app-footer">
        © {new Date().getFullYear()} ResumeAI &mdash; Powered by Google Gemini AI
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
