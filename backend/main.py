from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from ingest import clone_and_scan
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
# Make sure you have a .env file with GEMINI_API_KEY=your_key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

class RepoRequest(BaseModel):
    url: str
    doc_type: str = "README.md"

@app.post("/generate")
async def generate_docs(request: RepoRequest):
    print(f"Received request for: {request.url}")
    
    # 1. Scan Codebase
    try:
        codebase_context = clone_and_scan(request.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloning failed: {str(e)}")

    # 2. Prepare Prompt
    if request.doc_type == "CONTRIBUTING.md":
        focus = "how to contribute, pull request guidelines, and code of conduct"
    else:
        focus = "project purpose, installation, usage, and tech stack"

    prompt = f"""
    You are an AI Documentation Engineer. 
    Analyze the codebase below and generate a professional {request.doc_type}.
    Focus strictly on: {focus}.
    
    CODEBASE CONTEXT:
    {codebase_context[:100000]} 
    """
    # Note: We slice context[:100000] to prevent hitting token limits safely

    # 3. Generate
    try:
        response = model.generate_content(prompt)
        return {"markdown": response.text}
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail="AI generation failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)