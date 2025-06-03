#  ResumeAnalyzer – AI-Powered Resume Matching Tool

ResumeAnalyzer is an intelligent web application that allows users to upload resumes and match them against job descriptions using local NLP techniques (TF-IDF + cosine similarity). No external APIs or cloud models are used — it's completely offline and secure.

---

## Features

-  Upload resumes in PDF format
-  Input custom job descriptions
-  Local AI logic (TF-IDF + Cosine Similarity)
-  Match score with key highlights
-  User authentication with secure password hashing
-  Stores analysis history locally
-  Works without any API keys or internet dependency

---

## Tech Stack

**Backend**  
- Python 3.11  
- Flask 3.1.1  
- Gunicorn (for deployment)

**NLP & Machine Learning**  
- Scikit-learn  
- NLTK  
- PyMuPDF (PDF to text)

**Frontend**  
- HTML/CSS/Bootstrap 5  
- Font Awesome  
- JavaScript (custom validation + animations)

**Security & Utilities**  
- Werkzeug (password hashing)  
- Email Validator  
- Flask-SQLAlchemy *(JSON used for storage in practice)*

---

## Installation

### Clone & Set Up Locally

```bash
git clone https://github.com/your-username/resume-analyzer.git
cd resume-analyzer
pip install -r requirements.txt
python app.py


📜 License
This project is licensed under the MIT License.
