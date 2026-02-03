import google.generativeai as genai
import os
from dotenv import load_dotenv

# 1. Load the Key
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"--- DIAGNOSTIC TEST ---")
print(f"API Key Found: {'YES' if api_key else 'NO'}")

if not api_key:
    print("❌ ERROR: Please define GEMINI_API_KEY in backend/.env")
    exit()

# 2. Configure
try:
    genai.configure(api_key=api_key)
except Exception as e:
    print(f"❌ Configuration Failed: {e}")
    exit()

# 3. List Available Models
print("\n--- CHECKING AVAILABLE MODELS ---")
try:
    available_models = []
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ FOUND: {m.name}")
            available_models.append(m.name)
            
    if not available_models:
        print("❌ NO MODELS FOUND. Your API Key might be invalid or restricted.")
    else:
        print(f"\n✨ SUCCESS! You have access to {len(available_models)} models.")
except Exception as e:
    print(f"❌ CONNECTION ERROR: {e}")
    print("Tip: Check your internet or if the API Key is valid.")