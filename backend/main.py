from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from ingest import clone_and_scan
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found. Check your .env file!")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-flash-latest')

CURRENT_CODE_CONTEXT = ""
CURRENT_REPO_URL = ""

class RepoRequest(BaseModel):
    url: str
    doc_type: str = "README.md"

class ChatRequest(BaseModel):
    message: str
    repo_url: str

@app.post("/generate")
async def generate_docs(request: RepoRequest):
    global CURRENT_CODE_CONTEXT, CURRENT_REPO_URL
    
    if request.url != CURRENT_REPO_URL or not CURRENT_CODE_CONTEXT:
        print(f"Scanning new repo: {request.url}")
        CURRENT_CODE_CONTEXT = clone_and_scan(request.url)
        CURRENT_REPO_URL = request.url
    
    if request.doc_type == "CONTRIBUTING.md":
        focus = "how to contribute, pull request guidelines, and code of conduct"
    else:
        focus = "project purpose, installation, usage, and tech stack"

    prompt = f"""
    You are an AI Documentation Engineer. 
    Analyze the codebase below and generate a professional {request.doc_type}.
    Focus strictly on: {focus}.
    
    CODEBASE CONTEXT:
    {CURRENT_CODE_CONTEXT[:100000]} 
    """
    
    try:
        response = model.generate_content(prompt)
        return {"markdown": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_repo(request: ChatRequest):
    global CURRENT_CODE_CONTEXT, CURRENT_REPO_URL

    if request.repo_url != CURRENT_REPO_URL or not CURRENT_CODE_CONTEXT:
        print(f"Scanning repo for chat: {request.repo_url}")
        CURRENT_CODE_CONTEXT = clone_and_scan(request.repo_url)
        CURRENT_REPO_URL = request.repo_url

    prompt = f"""
    You are an expert developer assistant. Answer the user's question based strictly on the codebase provided below.
    
    USER QUESTION: {request.message}
    
    CODEBASE CONTEXT:
    {CURRENT_CODE_CONTEXT[:100000]}
    """
    
    try:
        response = model.generate_content(prompt)
        return {"response": response.text}
    except Exception as e:
        print("\n\n🔥 CRITICAL GEMINI ERROR 🔥")
        print(f"Error Type: {type(e)}")
        print(f"Error Message: {e}")
        print("Tip: Check your API_KEY in backend/.env")
        print("\n\n")
        raise HTTPException(status_code=500, detail=str(e))

class OverviewRequest(BaseModel):
    url: str

@app.post("/overview")
async def get_repo_overview(request: OverviewRequest):
    global CURRENT_CODE_CONTEXT, CURRENT_REPO_URL
    
    # Scan if needed
    if request.url != CURRENT_REPO_URL or not CURRENT_CODE_CONTEXT:
        print(f"Scanning repo for overview: {request.url}")
        CURRENT_CODE_CONTEXT = clone_and_scan(request.url)
        CURRENT_REPO_URL = request.url

    prompt = f"""
    You are a Senior Tech Lead. Analyze the codebase below and return a Strict JSON summary.
    
    Required JSON Structure:
    {{
        "description": "A 2-sentence summary of what this project does.",
        "tech_stack": ["List", "of", "languages/frameworks"],
        "key_features": ["Feature 1", "Feature 2", "Feature 3"],
        "stats": {{
            "files": "Estimated count",
            "complexity": "Low/Medium/High"
        }}
    }}
    
    CODEBASE CONTEXT:
    {CURRENT_CODE_CONTEXT[:100000]}
    """
    
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_text)
    except Exception as e:
        print(f"Overview Error: {e}")
        return {
            "description": "Could not analyze overview.", 
            "tech_stack": ["Unknown"], 
            "key_features": [],
            "stats": {"files": "?", "complexity": "?"}
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)