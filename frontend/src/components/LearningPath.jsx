import React, { useState, useEffect, useContext } from 'react';
import { getLearningPath } from '../services/aiService';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const priorityConfig = {
  high: { color: 'var(--danger)', icon: '🔥', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.4)' },
  medium: { color: 'var(--accent-secondary)', icon: '⚡', bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.4)' },
  low: { color: 'var(--success)', icon: '✅', bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.4)' },
};

const LearningPath = ({ onBack }) => {
  const [path, setPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPath = async () => {
      if (!user) {
        setError('login_required');
        setIsLoading(false);
        return;
      }
      try {
        const data = await getLearningPath();
        setPath(data);
      } catch (e) {
        if (e.message.includes('401')) {
          setError('login_required');
        } else {
          setError(e.message);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPath();
  }, [user]);

  if (isLoading) {
    return (
      <div className="loading-container fade-in">
        <div className="spinner"></div>
        <h2>Generating Your Personalized Learning Path...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Our AI is crafting a roadmap tailored specifically to your profile.</p>
      </div>
    );
  }

  if (error === 'login_required') {
    return (
      <div className="learning-path-container fade-in">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', marginTop: '24px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔐</div>
          <h2 style={{ marginBottom: '12px' }}>Login Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
            Your personalized learning path is saved to your account. Please log in to generate and view your roadmap.
          </p>
          <button className="btn-primary btn-lg" onClick={() => navigate('/')}>
            Go to Home & Log In
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="learning-path-container fade-in">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: 'var(--warning)', marginBottom: '12px' }}>Could Not Load Learning Path</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!path || !path.modules) return null;

  return (
    <div className="learning-path-container fade-in">
      <div className="learning-path-header">
        <button className="btn-back" onClick={onBack}>← Back to Dashboard</button>
        <div className="lp-title-block">
          <h1 className="gradient-text">{path.title || 'Your Learning Path'}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1.1rem' }}>
            Based on your resume and interview performance, we've crafted this roadmap to accelerate your growth.
          </p>
        </div>
      </div>

      <div className="modules-grid">
        {path.modules.map((module, index) => {
          const key = (module.priority || 'medium').toLowerCase();
          const config = priorityConfig[key] || priorityConfig.medium;
          return (
            <div
              key={module.id || index}
              className="module-card glass-panel fade-in"
              style={{
                '--priority-color': config.color,
                borderTop: `4px solid ${config.color}`,
                background: config.bg,
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="module-header">
                <span className="module-icon">{config.icon}</span>
                <span className="priority-tag" style={{ background: `${config.color}20`, color: config.color }}>
                  {module.priority} Priority
                </span>
              </div>
              <h3 className="module-title">{module.title}</h3>
              <p className="module-description">{module.description}</p>
              {module.resources && module.resources.length > 0 && (
                <div className="module-resources">
                  <h4>📚 Recommended Resources</h4>
                  <ul>
                    {module.resources.map((res, i) => (
                      <li key={i}>
                        <span className="resource-dot" style={{ background: config.color }}></span>
                        {res}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="lp-footer glass-panel">
        <p>🔄 Your learning path updates as you complete more mock interviews and resume analyses.</p>
        <button className="btn-primary" onClick={() => navigate('/interview')}>
          Practice with Mock Interview →
        </button>
      </div>
    </div>
  );
};

export default LearningPath;
