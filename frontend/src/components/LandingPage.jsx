import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content fade-in">
          <h1 className="hero-title">
            Unlock Your Career Potential with <span className="gradient-text">AI Precision</span>
          </h1>
          <p className="hero-subtitle">
            Optimize your resume, master your interviews, and chart your path to success using state-of-the-art Google Gemini AI.
          </p>
          <div className="hero-cta">
            <button className="btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
              Get Started for Free
            </button>
            <button className="btn-outline btn-lg" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
        </div>
        <div className="hero-visual fade-in">
            {/* Visual element or illustration can go here */}
            <div className="abstract-shape shape-1"></div>
            <div className="abstract-shape shape-2"></div>
        </div>
      </section>

      <section id="features" className="features-section">
        <h2 className="section-title">Everything You Need to Land the Job</h2>
        <div className="features-grid">
          <div className="feature-card glass-panel">
            <div className="feature-icon">📊</div>
            <h3>ATS Analysis</h3>
            <p>Get instant feedback on how well your resume matches the job description with a detailed ATS score.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon">🎙️</div>
            <h3>Mock Interviews</h3>
            <p>Practice with an AI interviewer that provides real-time feedback and tailors questions to your experience.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon">🗺️</div>
            <h3>Learning Paths</h3>
            <p>Receive a personalized career roadmap to bridge your skill gaps and prepare for your next big role.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon">🧠</div>
            <h3>AI Insights</h3>
            <p>Leverage Google Gemini 1.5 Flash to get the most accurate and up-to-date career advice.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Upload Documents</h4>
            <p>Drag and drop your resume and paste the job description.</p>
          </div>
          <div className="step-divider"></div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>AI Analysis</h4>
            <p>Our AI analyzes your fit and generates tailored preparation materials.</p>
          </div>
          <div className="step-divider"></div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Practice & Improve</h4>
            <p>Go through mock interviews and follow your custom learning path.</p>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="glass-panel cta-box">
          <h2>Ready to Ace Your Next Interview?</h2>
          <p>Join thousands of job seekers who use ResumeAI to land their dream jobs.</p>
          <button className="btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
            Analyze Your Resume Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
