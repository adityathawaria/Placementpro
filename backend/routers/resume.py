"""
Resume router — PDF parsing and skill extraction.
POST /api/parse-resume
"""

import io
import re
from fastapi import APIRouter, UploadFile, File, HTTPException

try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

router = APIRouter()

# Common skill keywords for extraction
SKILL_KEYWORDS = {
    "languages": ["python", "javascript", "java", "c++", "typescript", "go", "rust", "kotlin", "swift", "c#", "ruby", "php", "scala", "r"],
    "frontend": ["react", "vue", "angular", "html", "css", "tailwind", "bootstrap", "next.js", "gatsby", "svelte"],
    "backend": ["node", "fastapi", "django", "flask", "spring", "express", "rails", "laravel", "graphql", "rest"],
    "databases": ["mysql", "postgresql", "mongodb", "redis", "firestore", "sqlite", "oracle", "elasticsearch"],
    "cloud": ["aws", "gcp", "azure", "docker", "kubernetes", "terraform", "jenkins", "ci/cd", "github actions"],
    "ml_ai": ["tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "keras", "hugging face", "openai", "langchain"],
    "tools": ["git", "linux", "agile", "jira", "figma", "postman", "vscode"],
}


def extract_skills_from_text(text: str) -> dict:
    """Extract categorized skills mentioned in the resume text."""
    text_lower = text.lower()
    found_skills = {}
    for category, skills in SKILL_KEYWORDS.items():
        found = [s for s in skills if re.search(r"\b" + re.escape(s) + r"\b", text_lower)]
        if found:
            found_skills[category] = found
    return found_skills


def extract_sections(text: str) -> dict:
    """Try to extract key resume sections."""
    sections = {"education": "", "experience": "", "projects": "", "skills": ""}
    lines = text.split("\n")
    current_section = None
    section_patterns = {
        "education": r"education|academic",
        "experience": r"experience|work|employment|internship",
        "projects": r"project",
        "skills": r"skill|technical",
    }
    buffer = []
    for line in lines:
        line_lower = line.strip().lower()
        matched = None
        for sec, pattern in section_patterns.items():
            if re.search(pattern, line_lower) and len(line.strip()) < 40:
                matched = sec
                break
        if matched:
            if current_section and buffer:
                sections[current_section] = "\n".join(buffer).strip()
            current_section = matched
            buffer = []
        elif current_section:
            buffer.append(line)
    if current_section and buffer:
        sections[current_section] = "\n".join(buffer).strip()
    return sections


@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse a PDF resume and extract text, skills, and sections.
    Accepts multipart/form-data with a 'file' field.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10 MB).")

    if not PDF_AVAILABLE:
        raise HTTPException(status_code=503, detail="pdfplumber not installed.")

    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages_text = []
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    pages_text.append(page_text)
            full_text = "\n".join(pages_text)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {str(e)}")

    if not full_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from PDF (may be scanned/image-based).")

    skills = extract_skills_from_text(full_text)
    sections = extract_sections(full_text)

    # Flatten skill list for easy use
    all_skills_flat = [skill for category_skills in skills.values() for skill in category_skills]

    return {
        "success": True,
        "text": full_text[:5000],  # Truncate for API response (full stored separately)
        "full_text_length": len(full_text),
        "skills": skills,
        "all_skills": all_skills_flat,
        "sections": sections,
        "page_count": len(pages_text),
    }
