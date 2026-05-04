import React, { useState, useEffect } from 'react';
import { getHistory } from '../services/aiService';

const HistorySidebar = ({ isOpen, onClose, onSelectItem }) => {
  const [resumeHistory, setResumeHistory] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('resume');

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getHistory();
      // Support both new format (object with keys) and old format (array)
      if (Array.isArray(data)) {
        setResumeHistory(data);
        setInterviewHistory([]);
      } else {
        setResumeHistory(data.resume_history || []);
        setInterviewHistory(data.interview_history || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') return { bg: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', text: '✓ Completed' };
    return { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', text: '⏳ In Progress' };
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <div className={`history-sidebar glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>📚 Your History</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Tabs */}
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            Analyses ({resumeHistory.length})
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'interview' ? 'active' : ''}`}
            onClick={() => setActiveTab('interview')}
          >
            Interviews ({interviewHistory.length})
          </button>
        </div>

        <div className="sidebar-content">
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner" style={{ width: '30px', height: '30px', borderWidth: '3px' }}></div>
            </div>
          )}
          {error && <div className="error-msg">{error}</div>}

          {/* Resume History Tab */}
          {!loading && activeTab === 'resume' && (
            <>
              {resumeHistory.length === 0 ? (
                <p className="empty-state">No resume analyses yet. Upload a resume to get started!</p>
              ) : (
                resumeHistory.map((item) => (
                  <div key={item.id} className="history-item fade-in">
                    <div className="history-item-header">
                      <span className="history-date">
                        📅 {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="history-score" style={{ color: getScoreColor(item.ats_score) }}>
                        {item.ats_score}% Match
                      </span>
                    </div>
                    <p className="history-jd-preview">
                      {item.job_description.substring(0, 100)}...
                    </p>
                    <div className="history-stats">
                      <span>🎯 {item.interview_questions.length} Questions</span>
                      <span>💡 {item.prep_tricks.length} Tips</span>
                    </div>
                    <button
                      className="btn-view-history"
                      onClick={() => { onSelectItem(item); onClose(); }}
                    >
                      Reload This Analysis →
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {/* Interview History Tab */}
          {!loading && activeTab === 'interview' && (
            <>
              {interviewHistory.length === 0 ? (
                <p className="empty-state">No mock interviews yet. Complete a resume analysis first!</p>
              ) : (
                interviewHistory.map((item) => {
                  const badge = getStatusBadge(item.status);
                  return (
                    <div key={item.id} className="history-item fade-in">
                      <div className="history-item-header">
                        <span className="history-date">
                          📅 {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', padding: '3px 8px', borderRadius: '20px', background: badge.bg, color: badge.color }}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="history-jd-preview">
                        {item.job_description.substring(0, 100)}...
                      </p>
                      {item.performance_analysis && (
                        <div className="history-stats">
                          <span>⭐ Score: {item.performance_analysis.score}/100</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;
