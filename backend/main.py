from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from ingest import clone_and_scan
import os

app = FastAPI()

# Allow your React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Gemini
genai.configure(api_key="YOUR_GEMINI_API_KEY_HERE") 
model = genai.GenerativeModel('gemini-1.5-flash')

class RepoRequest(BaseModel):
    url: str

@app.post("/generate-docs")
async def generate_docs(request: RepoRequest):
    # 1. Scan the Repo
    print(f"Scanning {request.url}...")
    codebase_context = clone_and_scan(request.url)
    
    # 2. Ask Gemini to write the README [cite: 18]
    prompt = f"""
    You are an AI Documentation Engineer. Analyze this codebase and generate a 
    professional README.md in Markdown format.
    
    Include: Project Title, Description, Installation, Usage, and Tech Stack.
    
    CODEBASE:
    {codebase_context}
    """
    
    response = model.generate_content(prompt)
    return {"markdown": response.text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)