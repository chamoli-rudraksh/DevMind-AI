# DevMind AI ⚡

## Problem Statement

Modern codebases are difficult to understand due to fragmented tooling:
- Static analyzers provide raw findings but lack context
- Documentation tools generate summaries without structural grounding
- Developers spend excessive time navigating and interpreting codebases

DevMind-AI addresses this gap by combining deterministic analysis with context-aware AI reasoning to produce actionable, structured insights.

> AI-powered codebase intelligence — security audits, code quality scores, documentation generation, unit test creation, and git analytics from a single GitHub URL.

![DevMind AI](https://img.shields.io/badge/AI-Powered-3B82F6?style=flat-square&logo=google&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)

## System Architecture Overview

DevMind-AI follows a hybrid intelligence pipeline:

1. **Repository Ingestion**
   - Clones GitHub repository and extracts structure

2. **Deterministic Analysis**
   - Runs Bandit, Safety, and Detect-Secrets
   - Produces factual, structured outputs

3. **Context Construction**
   - Maps relationships between files, dependencies, and issues
   - Builds semantically meaningful context

4. **Generative Intelligence**
   - Uses LLM reasoning on grounded context
   - Generates documentation, explanations, and remediation steps

5. **Visualization Layer**
   - Presents insights via dashboard and structured outputs

For detailed explanation, see:
👉 `ARCHITECTURE_EXPLANATION.md`

## Features

| Feature | Description |
|---|---|
| 🏗️ **Project Overview** | AI summary of architecture, tech stack, and key features |
| 📂 **Structure Explorer** | Interactive file tree of the entire codebase |
| 🛡️ **Security Analysis** | Multi-tool scanning (Bandit + detect-secrets + Safety) + AI analysis |
| 📊 **Code Quality** | AI-powered maintainability score, grade, and detailed metrics |
| 🧪 **Test Generator** | Auto-generate unit tests for Jest, pytest, JUnit, and more |
| 📈 **Git Insights** | Top contributors, commit frequency, and most changed files |
| 📄 **Doc Generator** | AI-crafted README, CONTRIBUTING, ARCHITECTURE, and API docs |
| 💬 **AI Chat** | Context-aware chat assistant with suggested questions |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- [Ollama](https://ollama.com/) installed locally and running with the `llama3.1:8b` model (`ollama run llama3.1:8b`)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/DevMind-AI.git
cd DevMind-AI
```

### 2. Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Setup Frontend

```bash
# From the project root
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
DevMind-AI/
├── backend/
│   ├── main.py              # FastAPI app (all endpoints)
│   ├── ingest.py            # GitHub cloning & file scanning
│   ├── requirements.txt
│   ├── .env.example
│   └── security/
│       ├── bandit_analyzer.py
│       ├── detect_secrets_analyzer.py
│       └── safety_analyzer.py
├── src/
│   ├── App.jsx              # Root application
│   ├── index.jsx            # Entry point
│   ├── index.css            # Global styles
│   └── components/
│       ├── Header.jsx
│       ├── Hero.jsx
│       ├── Dashboard.jsx
│       ├── LoadingScreen.jsx
│       ├── ErrorBoundary.jsx
│       ├── CodebaseOverview.jsx
│       ├── ProjectStructure.jsx
│       ├── SecurityAnalysis.jsx
│       ├── CodeQuality.jsx        # NEW
│       ├── TestGenerator.jsx      # NEW
│       ├── GitInsights.jsx        # NEW
│       ├── DocGenerator.jsx
│       └── ChatInterface.jsx
├── index.html
├── vite.config.js
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/overview` | AI codebase summary |
| POST | `/structure` | File tree |
| POST | `/api/analyze-security` | Security scan |
| POST | `/api/analyze-quality` | Code quality metrics |
| POST | `/api/generate-tests` | Unit test generation |
| POST | `/api/git-insights` | Git history analysis |
| POST | `/generate` | Documentation generation |
| POST | `/chat` | AI chat |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ALLOWED_ORIGINS` | Optional | CORS allowed origins (default: `*`) |

## Tech Stack

**Frontend:** React 19, Vite 6, Framer Motion, Tailwind CSS, Lucide Icons, React Markdown

**Backend:** FastAPI, Python 3.11, Ollama (local AI), GitPython, Bandit, detect-secrets, Safety

## License

MIT
