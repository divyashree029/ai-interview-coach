import React, { useState, useEffect, useRef } from 'react';
import { startInterview, respondInterview } from '../services/aiService';

const MockInterview = ({ resumeText, jobDescription, onBack }) => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const initInterview = async () => {
      if (!resumeText || !jobDescription) {
        setError('Resume and job description are required. Please go back and analyze your resume first.');
        setIsStarting(false);
        return;
      }
      setIsStarting(true);
      try {
        const data = await startInterview(resumeText, jobDescription);
        setSessionId(data.session_id);
        setMessages([{ role: 'interviewer', content: data.question }]);
        setQuestionCount(1);
      } catch (e) {
        setError(e.message.includes('401') 
          ? 'You need to be logged in to use the Mock Interview feature.' 
          : `Failed to start interview: ${e.message}`);
      } finally {
        setIsStarting(false);
      }
    };
    initInterview();

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
        setUserAnswer(transcript);
      };
      recognitionRef.current.onerror = () => setIsRecording(false);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in your browser. Please type your answer.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setUserAnswer('');
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim() || isLoading) return;
    setIsLoading(true);
    setFeedback(null);
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); }

    const answerToSend = userAnswer;
    setMessages(prev => [...prev, { role: 'user', content: answerToSend }]);
    setUserAnswer('');

    try {
      const data = await respondInterview(sessionId, answerToSend);
      if (data.status === 'completed') {
        setAnalysis(data.analysis);
        setIsCompleted(true);
      } else {
        setFeedback(data.feedback);
        setMessages(prev => [...prev, { role: 'interviewer', content: data.next_question }]);
        setQuestionCount(q => q + 1);
      }
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  // --- COMPLETED STATE ---
  if (isCompleted && analysis) {
    const score = analysis.score || 0;
    const scoreColor = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
    return (
      <div className="interview-results fade-in">
        <div className="interview-result-header">
          <h2 className="gradient-text">Interview Complete! 🎉</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Here's how you performed in this mock session.</p>
        </div>

        <div className="result-score-box glass-panel">
          <div className="result-score-circle" style={{ '--score-color': scoreColor, '--score-deg': `${(score / 100) * 360}deg` }}>
            <span style={{ color: scoreColor, fontSize: '2rem', fontWeight: 700, position: 'relative', zIndex: 1 }}>{score}%</span>
          </div>
          <div>
            <h3>Overall Performance Score</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>{analysis.overall_feedback}</p>
          </div>
        </div>

        <div className="analysis-grid">
          <div className="analysis-card glass-panel">
            <h3 style={{ color: 'var(--success)', marginBottom: '16px' }}>✅ Strengths</h3>
            <ul className="analysis-list">
              {(analysis.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="analysis-card glass-panel">
            <h3 style={{ color: 'var(--warning)', marginBottom: '16px' }}>⚠️ Areas to Improve</h3>
            <ul className="analysis-list">
              {(analysis.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>

        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ marginBottom: '16px' }}>🚀 Recommendations</h3>
            <ul className="analysis-list">
              {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
          <button className="btn-primary" onClick={onBack}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // --- LOADING / ERROR STATE ---
  if (isStarting) {
    return (
      <div className="loading-container fade-in">
        <div className="spinner"></div>
        <h2>Preparing Your Interview Session...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>The AI interviewer is reviewing your resume.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mock-interview-container fade-in">
        <div className="interview-header">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <h2>Mock Interview</h2>
        </div>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ marginBottom: '12px', color: 'var(--warning)' }}>Unable to Start Interview</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{error}</p>
          <button className="btn-primary" style={{ marginTop: '24px' }} onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  // --- ACTIVE INTERVIEW STATE ---
  return (
    <div className="mock-interview-container fade-in">
      <div className="interview-header">
        <button className="btn-back" onClick={onBack}>← Exit</button>
        <div>
          <h2>Mock Interview Session</h2>
          <span className="interview-progress">Question {questionCount} / 5</span>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${(questionCount / 5) * 100}%` }}></div>
        </div>
      </div>

      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-wrap ${msg.role}`}>
            <div className="chat-avatar">{msg.role === 'interviewer' ? '🤖' : '🧑'}</div>
            <div className={`chat-bubble ${msg.role}`}>{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble-wrap interviewer">
            <div className="chat-avatar">🤖</div>
            <div className="chat-bubble interviewer thinking">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {feedback && (
        <div className="interviewer-feedback fade-in">
          💡 <strong>Quick feedback:</strong> {feedback}
        </div>
      )}

      <div className="interview-controls">
        <div className="input-group">
          <textarea
            placeholder="Type your answer here... (Ctrl+Enter to submit)"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className={`btn-voice ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
            disabled={isLoading}
          >
            {isRecording ? '⏹' : '🎤'}
          </button>
        </div>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={isLoading || !userAnswer.trim()}
        >
          {isLoading ? 'Thinking...' : 'Send Answer →'}
        </button>
        {isRecording && (
          <p style={{ textAlign: 'center', color: 'var(--danger)', fontSize: '0.85rem', animation: 'pulse 1.5s infinite' }}>
            🔴 Recording... Speak your answer
          </p>
        )}
      </div>
    </div>
  );
};

export default MockInterview;
