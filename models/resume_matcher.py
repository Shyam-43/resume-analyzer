import os
import re
import nltk
import fitz  # PyMuPDF
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import Dict, List, Tuple

class ResumeAnalyzer:
    """Resume analyzer using TF-IDF and cosine similarity"""
    
    def __init__(self):
        """Initialize the analyzer and download required NLTK data"""
        self._download_nltk_data()
        
        # Common skills patterns
        self.skill_patterns = [
            # Programming Languages
            r'\b(?:python|java|javascript|c\+\+|c#|ruby|php|swift|kotlin|go|rust|scala|perl|r|matlab)\b',
            # Web Technologies
            r'\b(?:html|css|react|angular|vue|node\.js|express|django|flask|spring|laravel|bootstrap|jquery)\b',
            # Databases
            r'\b(?:sql|mysql|postgresql|mongodb|redis|sqlite|oracle|cassandra|elasticsearch)\b',
            # Cloud & DevOps
            r'\b(?:aws|azure|gcp|docker|kubernetes|jenkins|git|github|gitlab|terraform|ansible)\b',
            # Data Science & ML
            r'\b(?:machine learning|deep learning|tensorflow|pytorch|scikit-learn|pandas|numpy|matplotlib|tableau|power bi)\b',
            # Project Management
            r'\b(?:agile|scrum|kanban|jira|confluence|project management|waterfall)\b',
            # Soft Skills
            r'\b(?:leadership|communication|teamwork|problem solving|analytical|creative|time management)\b'
        ]
        
        # Initialize TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=5000,
            lowercase=True
        )
    
    def _download_nltk_data(self):
        """Download required NLTK data"""
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            try:
                nltk.download('punkt', quiet=True)
            except:
                pass  # Fail silently if download fails
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            try:
                nltk.download('stopwords', quiet=True)
            except:
                pass  # Fail silently if download fails
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF using PyMuPDF"""
        try:
            doc = fitz.open(pdf_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text += page.get_text()
            
            doc.close()
            return text.strip()
        
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace and newlines
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep alphanumeric and common punctuation
        text = re.sub(r'[^\w\s\-\+\#\.]', ' ', text)
        
        # Remove extra spaces
        text = ' '.join(text.split())
        
        return text
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from text using pattern matching"""
        skills = set()
        text_lower = text.lower()
        
        for pattern in self.skill_patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            skills.update(matches)
        
        # Additional manual skill extraction for common terms
        skill_keywords = [
            'excel', 'powerpoint', 'word', 'office', 'photoshop', 'illustrator',
            'marketing', 'sales', 'customer service', 'data analysis',
            'business analysis', 'requirements gathering', 'testing',
            'quality assurance', 'qa', 'ui/ux', 'design', 'wireframing'
        ]
        
        for keyword in skill_keywords:
            if keyword in text_lower:
                skills.add(keyword)
        
        return sorted(list(skills))
    
    def calculate_similarity(self, resume_text: str, job_description: str) -> float:
        """Calculate cosine similarity between resume and job description"""
        try:
            # Preprocess texts
            resume_clean = self.preprocess_text(resume_text)
            job_clean = self.preprocess_text(job_description)
            
            if not resume_clean or not job_clean:
                return 0.0
            
            # Create TF-IDF vectors
            documents = [resume_clean, job_clean]
            tfidf_matrix = self.vectorizer.fit_transform(documents)
            
            # Calculate cosine similarity
            similarity_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            
            return float(similarity_matrix[0][0])
        
        except Exception as e:
            print(f"Error calculating similarity: {str(e)}")
            return 0.0
    
    def find_skill_matches(self, resume_skills: List[str], job_description: str) -> Tuple[List[str], List[str]]:
        """Find matched and missing skills"""
        job_description_lower = job_description.lower()
        
        # Extract skills from job description
        job_skills = self.extract_skills(job_description)
        
        # Find matches
        matched_skills = []
        for skill in resume_skills:
            if skill.lower() in job_description_lower or any(job_skill.lower() == skill.lower() for job_skill in job_skills):
                matched_skills.append(skill)
        
        # Find missing skills (skills mentioned in job description but not in resume)
        missing_skills = []
        resume_skills_lower = [skill.lower() for skill in resume_skills]
        
        for skill in job_skills:
            if skill.lower() not in resume_skills_lower:
                missing_skills.append(skill)
        
        # Remove duplicates and sort
        matched_skills = sorted(list(set(matched_skills)))
        missing_skills = sorted(list(set(missing_skills)))
        
        return matched_skills, missing_skills
    
    def analyze_resume(self, pdf_path: str, job_description: str) -> Dict:
        """Perform complete resume analysis"""
        try:
            # Extract text from PDF
            resume_text = self.extract_text_from_pdf(pdf_path)
            
            if not resume_text:
                raise Exception("No text could be extracted from the PDF file.")
            
            # Extract skills from resume
            resume_skills = self.extract_skills(resume_text)
            
            # Calculate similarity score
            similarity_score = self.calculate_similarity(resume_text, job_description)
            
            # Convert to percentage and round
            match_score = round(similarity_score * 100, 1)
            
            # Find skill matches
            matched_skills, missing_skills = self.find_skill_matches(resume_skills, job_description)
            
            # Adjust score based on skill matching
            if matched_skills:
                skill_bonus = min(len(matched_skills) * 2, 15)  # Up to 15% bonus
                match_score = min(match_score + skill_bonus, 100)
            
            return {
                'match_score': match_score,
                'matched_skills': matched_skills[:20],  # Limit to top 20
                'missing_skills': missing_skills[:15],  # Limit to top 15
                'total_resume_skills': len(resume_skills),
                'resume_text_length': len(resume_text)
            }
        
        except Exception as e:
            raise Exception(f"Resume analysis failed: {str(e)}")
