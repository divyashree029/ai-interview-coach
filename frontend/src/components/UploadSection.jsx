import React, { useState, useRef } from 'react';

const UploadSection = ({ onAnalyze, isLoading }) => {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleTriggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = () => {
    if (file && jd) {
      onAnalyze(file, jd);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-grid">
        {/* Resume Upload Column */}
        <div className="upload-card glass-panel">
          <h2>
            <span role="img" aria-label="document">📄</span> Upload Resume
          </h2>
          <div 
            className={`dropzone ${isDragActive ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleTriggerFileSelect}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
            />
            <div className="dropzone-icon">☁️</div>
            {file ? (
              <p><strong>{file.name}</strong> selected</p>
            ) : (
              <p>Drag and drop your resume here,<br/>or click to browse</p>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Supports PDF, DOCX, TXT
            </p>
          </div>
        </div>

        {/* Job Description Column */}
        <div className="upload-card glass-panel">
          <h2>
            <span role="img" aria-label="briefcase">💼</span> Job Description
          </h2>
          <textarea 
            className="jd-input"
            placeholder="Paste the target job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          ></textarea>
        </div>
      </div>

      <div className="action-bar">
        <button 
          className="btn-primary" 
          onClick={handleSubmit}
          disabled={!file || !jd || isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Generate Insights ✨'}
        </button>
      </div>
    </div>
  );
};

export default UploadSection;
