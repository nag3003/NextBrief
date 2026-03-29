import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(env_path)

api_key = os.getenv("OPENAI_API_KEY")
print(f"API Key exists: {bool(api_key)}")
if api_key:
    print(f"API Key starts with: {api_key[:10]}...")
    print(f"Is placeholder: {api_key == 'your_openai_api_key_here'}")
else:
    print("API Key is missing entirely.")
