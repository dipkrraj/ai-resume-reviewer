# AI Resume Reviewer

A professional, feature-rich resume analysis tool. It parses uploaded resumes (PDF or DOCX), performs scoring, checks structure, identifies repeated verbs, detects bullet points lacking metrics, and generates tailored interview prep questions.

---

## Stack
- **Backend**: FastAPI + SQLAlchemy + SQLite (supports PostgreSQL via `DATABASE_URL`)
- **LLM Engine**: Groq API (using the high-performance `llama-3.3-70b-versatile` model in native JSON mode with Pydantic validation)
- **Frontend**: React (Vite) + Tailwind CSS + React Router
- **Fonts**: Outfit (headings) & Inter (body) via Google Fonts

---

## Key Features

1. **ATS Score Gauge**: A visual SVG semi-circular gauge displaying compliance scores (overall and category breakdowns for Content, Sections, ATS Essentials, HR Red Flags, Discrimination, Seniority, and Tailoring).
2. **Dynamic Resume Template (Enhancv style)**: Toggle between the raw parsed text of your resume and a beautifully formatted premium layout parsed on-the-fly.
3. **Word Repetition Detector**: Scans your text dynamically to identify over-repeated verbs and suggests synonyms as clickable tags.
4. **Quantifiable Metrics Audit**: Scans work experience bullet points and lists items that lack numbers, percentages, or metrics.
5. **AI Bullet Fixer**: Rewrites weak bullet points using the Google-recommended XYZ format ("Accomplished X, measured by Y, by doing Z").
6. **Tailored Interview Prep**: Generates Easy, Medium, and Hard behavioral and technical questions based on your actual work history.
7. **Dashboard Scan History**: A document tracking feed showing past scans, upload dates, ATS scores, and overview statistics (Average score, Highest score, Total uploads).
8. **100% Free & Open-Source**: All features are fully unlocked with no simulated paywalls.

---

## Getting Started

### 1. Setup Environment Variables
Initialize your backend environment configuration:
```bash
cd backend
cp .env.example .env
```
Open the `.env` file and configure:
- `SECRET_KEY`: Generate a random 64-character security string:
  ```bash
  python3 -c "import secrets; print(secrets.token_hex(32))"
  ```
- `GROQ_API_KEY`: Add your Groq API key (`gsk_...`).
- `LLM_MODEL`: Defaults to `llama-3.3-70b-versatile`.

### 2. Run the Backend
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start dev server
uvicorn app.main:app --reload
```
API documentation will be available at `http://localhost:8000/docs`.

### 3. Run the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
The client app will start at `http://localhost:5173`.

---

## Exclusion of Confidential Files

A root-level [.gitignore](file:///Users/dilipraj/Downloads/ai-resume-reviewer/.gitignore) file is configured to exclude sensitive files, system logs, environment secrets, and build outputs:
- **Backend**: Excludes `.venv/`, `__pycache__/`, `.env`, and local database files (`resume_reviewer.db`).
- **Frontend**: Excludes `node_modules/`, `dist/` production builds, and `.env` local settings.
