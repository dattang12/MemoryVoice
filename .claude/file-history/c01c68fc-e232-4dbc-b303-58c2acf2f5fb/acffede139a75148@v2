import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def generate_coaching_feedback(analysis_summary, user_lang="en"):
    """
    Call Gemini 3 API to generate coaching feedback.

    Args:
        analysis_summary: Text summary of shot analysis
        user_lang: User's preferred language ("en" or "zh")

    Returns:
        Structured feedback from Gemini
    """
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key or api_key == "your-gemini-api-key-here":
        return {
            "technique": "Please configure your Gemini API key to get AI-generated feedback.",
            "strategy": "Set GEMINI_API_KEY in your .env file.",
            "training_plan": ["Configure API key", "Upload video", "Get real feedback"]
        }

    prompt = f"""
You are a professional badminton coach. Analyze the following performance data and provide coaching feedback.

{analysis_summary}

Provide feedback in the following format:

Technique: <Explain what the player can improve in their form, focusing on specific issues found>

Strategy: <Suggest in-game strategy improvements based on shot patterns>

Training Plan:
- <Drill 1 to address weaknesses>
- <Drill 2 to address weaknesses>
- <Drill 3 to address weaknesses>

Respond in {'Chinese' if user_lang.startswith('zh') else 'English'}.
"""

    GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"
    headers = { "Content-Type": "application/json" }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        response = requests.post(
            f"{GEMINI_API_URL}?key={api_key}",
            headers=headers,
            data=json.dumps(payload)
        )

        if response.status_code != 200:
            raise Exception(f"Gemini API Error {response.status_code}: {response.text}")

        output_text = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        feedback = parse_feedback(output_text)
        return feedback

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {
            "technique": f"Error generating feedback: {str(e)}",
            "strategy": "Please check your API key and try again.",
            "training_plan": ["Check API configuration", "Retry analysis"]
        }


def parse_feedback(output_text):
    """Parse Gemini output into structured feedback."""
    feedback = {
        "technique": "",
        "strategy": "",
        "training_plan": []
    }

    lines = output_text.split('\n')
    current_section = None

    for line in lines:
        line_lower = line.lower().strip()

        if line_lower.startswith("technique:"):
            current_section = "technique"
            feedback["technique"] = line.split(":", 1)[1].strip()
        elif line_lower.startswith("strategy:"):
            current_section = "strategy"
            feedback["strategy"] = line.split(":", 1)[1].strip()
        elif line_lower.startswith("training plan"):
            current_section = "training_plan"
        elif current_section == "training_plan" and line.strip().startswith("-"):
            feedback["training_plan"].append(line.strip().lstrip("-").strip())
        elif current_section and line.strip() and not line.strip().startswith("#"):
            if current_section != "training_plan":
                feedback[current_section] += " " + line.strip()

    return feedback

