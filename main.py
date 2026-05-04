import base64
import json
import os
import random
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file
from google.cloud import bigquery
from google.cloud import storage
import google.generativeai as genai
import pypdf
import io
import jwt
import bcrypt
from functools import wraps

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Enable CORS for all origins on /api routes

app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", "super-secret-key")

# Configure Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "your-api-key-here"))

class MockSession:
    def add(self, obj):
        if hasattr(obj, 'save'):
            obj.save()
    def commit(self):
        pass

class MockDB:
    session = MockSession()
    def create_all(self):
        pass

db = MockDB()

class ModelBase:
    _id_counter = 1
    
    def __init__(self, **kwargs):
        self.transcript = '[]'
        self.performance_analysis = '{}'
        self.status = 'active'
        for k, v in kwargs.items():
            setattr(self, k, v)
        self.id = self.__class__._id_counter
        self.__class__._id_counter += 1
        if not hasattr(self, 'created_at'):
            self.created_at = datetime.utcnow()

    def save(self):
        if self not in self.__class__._records:
            self.__class__._records.append(self)

class Query:
    def __init__(self, records):
        self.records = records

    def filter_by(self, **kwargs):
        filtered = []
        for r in self.records:
            match = True
            for k, v in kwargs.items():
                if getattr(r, k, None) != v:
                    match = False
            if match:
                filtered.append(r)
        return Query(filtered)

    def order_by(self, key_func):
        return Query(list(reversed(self.records)))

    def all(self):
        return self.records

    def first(self):
        return self.records[0] if self.records else None

class QueryBuilder:
    def __init__(self, model_class):
        self.model_class = model_class
    def filter_by(self, **kwargs):
        return Query(self.model_class._records).filter_by(**kwargs)
    def all(self):
        return self.model_class._records
    def first(self):
        return self.model_class._records[0] if self.model_class._records else None
    def order_by(self, attr):
        return Query(list(reversed(self.model_class._records)))

class FakeAttr:
    def desc(self):
        return self

class User(ModelBase):
    _records = []
User.query = QueryBuilder(User)

class ResumeHistory(ModelBase):
    _records = []
    created_at = FakeAttr()
ResumeHistory.query = QueryBuilder(ResumeHistory)

class InterviewSession(ModelBase):
    _records = []
    created_at = FakeAttr()
InterviewSession.query = QueryBuilder(InterviewSession)

class LearningPath(ModelBase):
    _records = []
    created_at = FakeAttr()
LearningPath.query = QueryBuilder(LearningPath)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split(" ")
            if len(parts) == 2 and parts[0] == "Bearer":
                token = parts[1]
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data["user_id"]).first()
        except:
            return jsonify({"error": "Token is invalid"}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def optional_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        current_user = None
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split(" ")
            if len(parts) == 2 and parts[0] == "Bearer":
                token = parts[1]
        if token:
            try:
                data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
                current_user = User.query.filter_by(id=data["user_id"]).first()
            except:
                pass
        return f(current_user, *args, **kwargs)
    return decorated

# Removed GCP clients to allow local execution without credentials.
# bq_client = bigquery.Client()
# storage_client = storage.Client()

# Environment variables
BQ_DATASET = os.environ.get("BQ_DATASET", "document_processing")
BQ_TABLE = os.environ.get("BQ_TABLE", "metadata")

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "Interview Prep Backend is running"}), 200

def process_document_simulated(file_name):
    """Simulated local processing without GCP."""
    print(f"Locally processing {file_name}")
    # In local mode, we just log it
    return True

def extract_text_from_pdf(file_stream):
    try:
        pdf = pypdf.PdfReader(file_stream)
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Missing username or password"}), 400
    
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "User already exists"}), 400
        
    hashed_password = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = User(username=data["username"], password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Missing username or password"}), 400
        
    user = User.query.filter_by(username=data["username"]).first()
    if not user or not bcrypt.checkpw(data["password"].encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"error": "Invalid credentials"}), 401
        
    token = jwt.encode({"user_id": user.id}, app.config["SECRET_KEY"], algorithm="HS256")
    return jsonify({"token": token, "username": user.username})

@app.route("/api/history", methods=["GET"])
@token_required
def history(current_user):
    # Fetch Resume History
    records = ResumeHistory.query.filter_by(user_id=current_user.id).order_by(ResumeHistory.created_at.desc()).all()
    resume_results = []
    for r in records:
        resume_results.append({
            "type": "resume_analysis",
            "id": r.id,
            "job_description": r.job_description,
            "resume_text": r.resume_text,
            "ats_score": r.ats_score,
            "interview_questions": json.loads(r.interview_questions),
            "prep_tricks": json.loads(r.prep_tricks),
            "created_at": r.created_at.isoformat()
        })
    
    # Fetch Interview History
    interviews = InterviewSession.query.filter_by(user_id=current_user.id).order_by(InterviewSession.created_at.desc()).all()
    interview_results = []
    for i in interviews:
        interview_results.append({
            "type": "interview_session",
            "id": i.id,
            "job_description": i.job_description,
            "status": i.status,
            "performance_analysis": json.loads(i.performance_analysis) if i.performance_analysis and i.performance_analysis != '{}' else None,
            "created_at": i.created_at.isoformat()
        })
    
    return jsonify({
        "resume_history": resume_results,
        "interview_history": interview_results
    })

@app.route("/api/interview/<int:session_id>", methods=["GET"])
@token_required
def get_interview_details(current_user, session_id):
    session = InterviewSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    return jsonify({
        "id": session.id,
        "job_description": session.job_description,
        "resume_text": session.resume_text,
        "transcript": json.loads(session.transcript),
        "performance_analysis": json.loads(session.performance_analysis) if session.performance_analysis and session.performance_analysis != '{}' else None,
        "status": session.status,
        "created_at": session.created_at.isoformat()
    })

@app.route("/api/analyze", methods=["POST"])
@optional_token
def analyze_resume(current_user):
    if "resume" not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    if "job_description" not in request.form:
        return jsonify({"error": "No job description provided"}), 400

    resume_file = request.files["resume"]
    job_desc = request.form["job_description"]

    # Extract text from the uploaded resume
    if resume_file.filename.endswith(".pdf"):
        resume_text = extract_text_from_pdf(resume_file.stream)
    else:
        # Fallback for txt files
        try:
            resume_text = resume_file.read().decode("utf-8")
        except Exception as e:
            return jsonify({"error": f"Failed to read resume file: {e}"}), 400

    if not resume_text.strip():
        return jsonify({"error": "Could not extract text from the resume"}), 400

    # Call Gemini API
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        You are an expert technical recruiter and interview coach. Analyze the provided resume against the job description.
        
        Job Description:
        {job_desc}
        
        Resume:
        {resume_text}
        
        Return the analysis strictly as a JSON object with exactly this schema:
        {{
          "atsScore": {{
            "score": <integer from 0 to 100>,
            "feedback": "<short string explaining the score>"
          }},
          "interviewQuestions": [
            {{
              "id": <unique integer>,
              "question": "<potential interview question based on resume and JD>",
              "context": "<why this question is being asked>"
            }}
          ],
          "prepTricks": [
            "<actionable advice string 1>",
            "<actionable advice string 2>",
            "<actionable advice string 3>",
            "<actionable advice string 4>"
          ]
        }}
        
        Ensure there are exactly 4 prep tricks and at least 4 interview questions.
        Provide ONLY the raw JSON format with no markdown formatting like ```json or anything else.
        """
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up possible markdown code block
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        analysis_data = json.loads(response_text.strip())
        analysis_data["resume_text"] = resume_text
        
        # Save to history if logged in
        if current_user:
            history_record = ResumeHistory(
                user_id=current_user.id,
                job_description=job_desc,
                resume_text=resume_text, # Save resume text
                ats_score=analysis_data.get("atsScore", {}).get("score", 0),
                interview_questions=json.dumps(analysis_data.get("interviewQuestions", [])),
                prep_tricks=json.dumps(analysis_data.get("prepTricks", [])),
            )
            db.session.add(history_record)
            db.session.commit()
            
        return jsonify(analysis_data)
    except Exception as e:
        print(f"Error calling Gemini or parsing JSON: {e}")
        # Return fallback mock data if it fails
        analysis_data = {
            "atsScore": {"score": 50, "feedback": "Note: Using fallback mock data because the AI service failed (likely an invalid API key)."},
            "resume_text": resume_text,
            "interviewQuestions": [
                {"id": 1, "question": "What are your core strengths?", "context": "Standard introductory question."},
                {"id": 2, "question": "Tell me about a time you solved a complex problem.", "context": "Behavioral question."},
                {"id": 3, "question": "Where do you see yourself in 5 years?", "context": "Career goals."},
                {"id": 4, "question": "Why do you want to work here?", "context": "Interest in the company."}
            ],
            "prepTricks": [
                "Practice your pitch in front of a mirror.",
                "Research the company values thoroughly.",
                "Prepare STAR method examples for behavioral questions.",
                "Ensure your background is clean for video interviews."
            ]
        }
        
        # Save fallback to history if logged in
        if current_user:
            history_record = ResumeHistory(
                user_id=current_user.id,
                job_description=job_desc,
                resume_text=resume_text,
                ats_score=analysis_data.get("atsScore", {}).get("score", 0),
                interview_questions=json.dumps(analysis_data.get("interviewQuestions", [])),
                prep_tricks=json.dumps(analysis_data.get("prepTricks", [])),
            )
            db.session.add(history_record)
            db.session.commit()
            
        return jsonify(analysis_data), 200


@app.route("/api/interview/start", methods=["POST"])
@token_required
def start_interview(current_user):
    data = request.get_json()
    job_desc = data.get("job_description")
    resume_text = data.get("resume_text")
    
    if not job_desc or not resume_text:
        return jsonify({"error": "Missing job description or resume text"}), 400
        
    session = InterviewSession(
        user_id=current_user.id,
        job_description=job_desc,
        resume_text=resume_text,
        transcript=json.dumps([])
    )
    db.session.add(session)
    db.session.commit()
    
    # Generate the first question
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        You are an elite interviewer for the following job description.
        Job Description: {job_desc}
        Candidate Resume: {resume_text}
        
        Start the interview by introducing yourself briefly and asking the first interview question. 
        Keep it professional and challenging.
        Return ONLY the question text.
        """
        response = model.generate_content(prompt)
        first_question = response.text.strip()
        
        transcript = []
        transcript.append({"role": "interviewer", "content": first_question})
        session.transcript = json.dumps(transcript)
        db.session.commit()
        
        return jsonify({
            "session_id": session.id,
            "question": first_question
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/interview/respond", methods=["POST"])
@token_required
def respond_interview(current_user):
    data = request.get_json()
    session_id = data.get("session_id")
    user_answer = data.get("answer")
    
    session = InterviewSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    transcript = json.loads(session.transcript)
    transcript.append({"role": "user", "content": user_answer})
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Decide if we should continue or end (limit to 5 questions for this demo)
        num_questions = sum(1 for m in transcript if m["role"] == "interviewer")
        
        if num_questions >= 5:
            # End interview and analyze
            session.status = "completed"
            
            analysis_prompt = f"""
            Analyze the following interview transcript.
            Job Description: {session.job_description}
            Resume: {session.resume_text}
            Transcript: {json.dumps(transcript)}
            
            Provide a performance analysis strictly in JSON:
            {{
              "score": <0-100>,
              "strengths": [<string>, ...],
              "weaknesses": [<string>, ...],
              "overall_feedback": "<string>",
              "recommendations": [<string>, ...]
            }}
            Return ONLY the raw JSON.
            """
            analysis_resp = model.generate_content(analysis_prompt)
            analysis_text = analysis_resp.text.strip()
            # Clean up markdown
            if "```" in analysis_text:
                analysis_text = analysis_text.split("```")[1]
                if analysis_text.startswith("json"):
                    analysis_text = analysis_text[4:]
            
            session.performance_analysis = analysis_text
            session.transcript = json.dumps(transcript)
            db.session.commit()
            
            return jsonify({
                "status": "completed",
                "analysis": json.loads(analysis_text.strip())
            })
        else:
            # Continue interview
            interviewer_prompt = f"""
            Continue the interview.
            Job Description: {session.job_description}
            Resume: {session.resume_text}
            Transcript: {json.dumps(transcript)}
            
            Provide brief feedback on the last answer (max 1 sentence) and ask the next follow-up question.
            Return ONLY a JSON object:
            {{
              "feedback": "<feedback string>",
              "next_question": "<question string>"
            }}
            Return ONLY the raw JSON.
            """
            resp = model.generate_content(interviewer_prompt)
            resp_text = resp.text.strip()
            # Clean up markdown
            if "```" in resp_text:
                resp_text = resp_text.split("```")[1]
                if resp_text.startswith("json"):
                    resp_text = resp_text[4:]
            
            resp_data = json.loads(resp_text.strip())
            transcript.append({"role": "interviewer", "content": resp_data["next_question"]})
            session.transcript = json.dumps(transcript)
            db.session.commit()
            
            return jsonify({
                "status": "active",
                "feedback": resp_data["feedback"],
                "next_question": resp_data["next_question"]
            })
            
    except Exception as e:
        print(f"Error in interview: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/learning-path", methods=["GET"])
@token_required
def get_learning_path(current_user):
    # Check for existing path
    path = LearningPath.query.filter_by(user_id=current_user.id).order_by(LearningPath.created_at.desc()).first()
    
    # If no path or old, generate a new one based on history and interviews
    if not path or (datetime.utcnow() - path.created_at).days > 7:
        # Fetch history and interviews
        history = ResumeHistory.query.filter_by(user_id=current_user.id).all()
        interviews = InterviewSession.query.filter_by(user_id=current_user.id, status="completed").all()
        
        context = f"History entries: {len(history)}, Completed interviews: {len(interviews)}\n"
        if interviews:
            last_interview = interviews[-1]
            context += f"Last Interview Analysis: {last_interview.performance_analysis}"
            
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
            Based on the following candidate data, create a personalized learning path to help them land their target job.
            Context: {context}
            
            Return a JSON object with exactly this schema:
            {{
              "title": "Your Custom Career Path",
              "modules": [
                {{
                  "id": 1,
                  "title": "<module title>",
                  "description": "<what to learn>",
                  "resources": ["<resource 1>", "<resource 2>"],
                  "priority": "High"|"Medium"|"Low"
                }}
              ]
            }}
            Provide exactly 4 modules. Return ONLY raw JSON.
            """
            resp = model.generate_content(prompt)
            path_text = resp.text.strip()
            # Clean up markdown
            if "```" in path_text:
                path_text = path_text.split("```")[1]
                if path_text.startswith("json"):
                    path_text = path_text[4:]
            
            new_path = LearningPath(user_id=current_user.id, path_data=path_text.strip())
            db.session.add(new_path)
            db.session.commit()
            return jsonify(json.loads(path_text.strip()))
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify(json.loads(path.path_data))

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    PORT = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=PORT, debug=True)
