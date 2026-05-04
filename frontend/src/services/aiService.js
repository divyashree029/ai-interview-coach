const API_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
};

export const register = async (username, password) => {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
};

export const login = async (username, password) => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data; // contains token and username
};

export const getHistory = async () => {
  const res = await fetch(`${API_URL}/history`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch history');
  return data;
};

export const analyzeResume = async (resumeFile, jobDescription) => {
  try {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('job_description', jobDescription);

    const res = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: getHeaders(), // Automatically attach token if logged in
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API error response:", errorText);
      throw new Error(`API error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Failed to analyze resume via API:", error);
    throw error;
  }
};

export const startInterview = async (resumeText, jobDescription) => {
  const res = await fetch(`${API_URL}/interview/start`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to start interview');
  return data;
};

export const respondInterview = async (sessionId, answer) => {
  const res = await fetch(`${API_URL}/interview/respond`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify({ session_id: sessionId, answer })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit response');
  return data;
};

export const getLearningPath = async () => {
  const res = await fetch(`${API_URL}/learning-path`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch learning path');
  return data;
};
