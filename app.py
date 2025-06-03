import os
import json
import logging
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import uuid
from models.resume_matcher import ResumeAnalyzer

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "resume-analyzer-secret-key-2024")

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure required directories exist
os.makedirs('data', exist_ok=True)
os.makedirs('uploads', exist_ok=True)

# Initialize Resume Analyzer
analyzer = ResumeAnalyzer()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_users():
    """Load users from JSON file"""
    try:
        with open('data/users.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_users(users):
    """Save users to JSON file"""
    with open('data/users.json', 'w') as f:
        json.dump(users, f, indent=2)

def load_analysis_history():
    """Load analysis history from JSON file"""
    try:
        with open('data/analysis_history.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_analysis_history(history):
    """Save analysis history to JSON file"""
    with open('data/analysis_history.json', 'w') as f:
        json.dump(history, f, indent=2, default=str)

def get_user_analyses(username):
    """Get all analyses for a specific user"""
    history = load_analysis_history()
    return [analysis for analysis in history if analysis.get('username') == username]

@app.route('/')
def index():
    """Landing page"""
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        username = request.form['username'].strip()
        email = request.form['email'].strip()
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        # Validation
        if not username or not email or not password:
            flash('All fields are required.', 'error')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('register.html')
        
        if len(password) < 6:
            flash('Password must be at least 6 characters long.', 'error')
            return render_template('register.html')
        
        users = load_users()
        
        # Check if user already exists
        if username in users:
            flash('Username already exists.', 'error')
            return render_template('register.html')
        
        # Check if email already exists
        for user_data in users.values():
            if user_data.get('email') == email:
                flash('Email already registered.', 'error')
                return render_template('register.html')
        
        # Create new user
        users[username] = {
            'email': email,
            'password_hash': generate_password_hash(password),
            'created_at': datetime.now().isoformat()
        }
        
        save_users(users)
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']
        
        users = load_users()
        
        if username in users and check_password_hash(users[username]['password_hash'], password):
            session['username'] = username
            session['email'] = users[username]['email']
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """User logout"""
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    """User dashboard with analysis history"""
    if 'username' not in session:
        flash('Please log in to access the dashboard.', 'error')
        return redirect(url_for('login'))
    
    username = session['username']
    analyses = get_user_analyses(username)
    
    # Sort by date, most recent first
    analyses.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    return render_template('dashboard.html', analyses=analyses)

@app.route('/upload', methods=['GET', 'POST'])
def upload():
    """Upload resume and job description"""
    if 'username' not in session:
        flash('Please log in to upload a resume.', 'error')
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        # Check if file was uploaded
        if 'resume' not in request.files:
            flash('No resume file selected.', 'error')
            return render_template('upload.html')
        
        file = request.files['resume']
        job_description = request.form['job_description'].strip()
        
        if file.filename == '':
            flash('No resume file selected.', 'error')
            return render_template('upload.html')
        
        if not job_description:
            flash('Job description is required.', 'error')
            return render_template('upload.html')
        
        if file and allowed_file(file.filename):
            # Save file
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            
            try:
                # Analyze resume
                analysis_result = analyzer.analyze_resume(file_path, job_description)
                
                # Save analysis to history
                history = load_analysis_history()
                analysis_record = {
                    'id': str(uuid.uuid4()),
                    'username': session['username'],
                    'timestamp': datetime.now().isoformat(),
                    'filename': filename,
                    'match_score': analysis_result['match_score'],
                    'matched_skills': analysis_result['matched_skills'],
                    'missing_skills': analysis_result['missing_skills'],
                    'job_description': job_description[:500] + '...' if len(job_description) > 500 else job_description
                }
                history.append(analysis_record)
                save_analysis_history(history)
                
                # Clean up uploaded file
                os.remove(file_path)
                
                return render_template('result.html', result=analysis_result, analysis_id=analysis_record['id'])
                
            except Exception as e:
                # Clean up uploaded file
                if os.path.exists(file_path):
                    os.remove(file_path)
                flash(f'Error analyzing resume: {str(e)}', 'error')
                return render_template('upload.html')
        else:
            flash('Invalid file type. Please upload a PDF file.', 'error')
    
    return render_template('upload.html')

@app.route('/result')
@app.route('/result/<analysis_id>')
def result(analysis_id=None):
    """Show analysis result"""
    if 'username' not in session:
        flash('Please log in to view results.', 'error')
        return redirect(url_for('login'))
    
    if analysis_id:
        # Load specific analysis from history
        history = load_analysis_history()
        analysis = None
        
        for item in history:
            if item.get('id') == analysis_id and item.get('username') == session['username']:
                analysis = item
                break
        
        if not analysis:
            flash('Analysis not found or access denied.', 'error')
            return redirect(url_for('dashboard'))
        
        # Convert to result format expected by template
        result_data = {
            'match_score': analysis['match_score'],
            'matched_skills': analysis['matched_skills'],
            'missing_skills': analysis['missing_skills']
        }
        
        return render_template('result.html', result=result_data, analysis_id=analysis_id, 
                             from_history=True, analysis_date=analysis['timestamp'],
                             filename=analysis['filename'])
    
    # This route is typically accessed via POST from upload
    # If accessed directly, redirect to upload
    return redirect(url_for('upload'))

@app.route('/profile')
def profile():
    """User profile page"""
    if 'username' not in session:
        flash('Please log in to view your profile.', 'error')
        return redirect(url_for('login'))
    
    username = session['username']
    users = load_users()
    user_data = users.get(username, {})
    
    # Get user statistics
    analyses = get_user_analyses(username)
    stats = {
        'total_analyses': len(analyses),
        'avg_score': sum(a.get('match_score', 0) for a in analyses) / len(analyses) if analyses else 0,
        'best_score': max(a.get('match_score', 0) for a in analyses) if analyses else 0,
        'member_since': user_data.get('created_at', 'Unknown')
    }
    
    return render_template('profile.html', user_data=user_data, stats=stats)

@app.route('/about')
def about():
    """About page"""
    return render_template('about.html')

@app.route('/contact')
def contact():
    """Contact page"""
    return render_template('contact.html')

@app.errorhandler(404)
def not_found(error):
    """Custom 404 page"""
    return render_template('404.html'), 404

@app.errorhandler(413)
def too_large(error):
    """Handle file too large error"""
    flash('File too large. Please upload a file smaller than 16MB.', 'error')
    return redirect(url_for('upload'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
