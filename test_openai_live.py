from openai import OpenAI
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(env_path)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(
    api_key=OPENAI_API_KEY, 
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "https://nexbrief.vercel.app",
        "X-Title": "NexBrief AI Test"
    }
)

try:
    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[{"role": "user", "content": "Say hello!"}],
        max_tokens=10
    )
    print("Success!")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Error: {e}")
