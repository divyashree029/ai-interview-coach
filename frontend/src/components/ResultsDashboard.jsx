import React from 'react';
import { jsPDF } from 'jspdf';

const AtsScoreCard = ({ atsData }) => {
  const { score, feedback } = atsData;
  let color = 'var(--danger)';
  let label = 'Needs Work';
  if (score >= 75) { color = 'var(--success)'; label = 'Excellent Match'; }
  else if (score >= 50) { color = 'var(--warning)'; label = 'Good Match'; }

  const scoreDeg = `${(score / 100) * 360}deg`;

  return (
    <div className="score-card glass-panel" style={{ '--score-color': color, '--score-deg': scoreDeg }}>
      <h3>ATS Match Score</h3>
      <div className="score-circle">
        <span className="score-value">{score}%</span>
      </div>
      <span className="score-label" style={{ color, fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <p style={{ marginTop: '8px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
        {feedback}
      </p>
    </div>
  );
};

const InterviewQuestions = ({ questions }) => {
  return (
    <div className="questions-card glass-panel">
      <h3>🎯 Predicted Interview Questions</h3>
      <div className="questions-list">
        {questions.map((q, i) => (
          <div key={q.id || i} className="question-item">
            <span className="question-number">Q{i + 1}</span>
            <div>
              <h4>{q.question}</h4>
              <p><strong>Why this question:</strong> {q.context}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PrepTricks = ({ tricks }) => {
  const icons = ['🎯', '🔍', '⚡', '🧠', '💬', '📈'];
  return (
    <div className="tricks-card glass-panel">
      <h3>💡 Preparation Tricks</h3>
      <div className="tricks-list">
        {tricks.map((trick, index) => (
          <div key={index} className="trick-item">
            <div className="trick-icon">{icons[index % icons.length]}</div>
            <p>{trick}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResultsDashboard = ({ results, onReset }) => {
  if (!results) return null;

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text('ResumeAI — Analysis Report', pageW / 2, y, { align: 'center' });
    y += 12;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, y, { align: 'center' });
    y += 16;

    // ATS Score
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, pageW - 30, 22, 4, 4, 'F');
    doc.setTextColor(59, 130, 246);
    doc.text(`ATS Score: ${results.atsScore.score}%`, 22, y + 9);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const feedbackLines = doc.splitTextToSize(results.atsScore.feedback, pageW - 44);
    doc.text(feedbackLines, 22, y + 17);
    y += 30 + (feedbackLines.length > 1 ? (feedbackLines.length - 1) * 5 : 0);

    // Prep Tricks
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Preparation Tips', 15, y);
    y += 8;
    doc.setFontSize(10);
    results.prepTricks.forEach((trick, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setTextColor(59, 130, 246);
      doc.text(`${i + 1}.`, 18, y);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(trick, pageW - 38);
      doc.text(lines, 25, y);
      y += 6 + (lines.length > 1 ? (lines.length - 1) * 5 : 0);
    });
    y += 8;

    // Interview Questions
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Predicted Interview Questions', 15, y);
    y += 8;
    doc.setFontSize(10);
    results.interviewQuestions.forEach((q, i) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setTextColor(59, 130, 246);
      doc.text(`Q${i + 1}:`, 18, y);
      doc.setTextColor(30, 41, 59);
      const qLines = doc.splitTextToSize(q.question, pageW - 38);
      doc.text(qLines, 28, y);
      y += 5 * qLines.length + 1;
      doc.setTextColor(100, 116, 139);
      const ctxLines = doc.splitTextToSize(`Context: ${q.context}`, pageW - 38);
      doc.text(ctxLines, 28, y);
      y += 5 * ctxLines.length + 4;
    });

    doc.save('ResumeAI_Analysis.pdf');
  };

  return (
    <div className="results-container fade-in">
      <div className="results-header">
        <div>
          <h2 className="gradient-text">Analysis Complete ✨</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Here's your personalized career intelligence report.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-export" onClick={handleExportPDF}>
            📥 Export PDF
          </button>
          <button className="btn-outline" onClick={onReset} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            ← Analyze Another
          </button>
        </div>
      </div>

      <div className="results-grid">
        {/* Left Column - Score and Tricks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <AtsScoreCard atsData={results.atsScore} />
          <PrepTricks tricks={results.prepTricks} />
        </div>

        {/* Right Column - Questions */}
        <div>
          <InterviewQuestions questions={results.interviewQuestions} />
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
