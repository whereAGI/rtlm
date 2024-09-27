import os
import json
import base64
import asyncio
import aiohttp
import logging
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi.responses import Response, JSONResponse
from groq import Groq  # Import the Groq client

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("app")

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load API Keys from environment variables
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# RIME_API_KEY = os.getenv("RIME_API_KEY")
RIME_VOICE_ID = os.getenv("RIME_VOICE_ID", "Colby")  # Default to "Colby"

# Validate API Keys
"""if not GROQ_API_KEY:
    raise Exception("GROQ_API_KEY is missing in the .env file.")
if not RIME_API_KEY:
    raise Exception("RIME_API_KEY is missing in the .env file.")"""

@app.get("/")
def read_root():
    return {"message": "RTLM Backend is running"}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribes audio using Whisper API on Groq."""

    logger.info(f"Received Audio File: {file.filename}")
    logger.info(f"File Content-Type: {file.content_type}")

    allowed_content_types = ["audio/wav", "audio/mpeg", "audio/m4a", "audio/webm"]
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid audio file format. Supported formats: {', '.join(allowed_content_types)}"
        )

    contents = await file.read()
    logger.info(f"File size: {len(contents)} bytes")

    try:
        # Initialize the Groq client
        client = Groq(api_key=groq_api_key)

        transcription = client.audio.transcriptions.create(
            file=(file.filename, contents),  # Use filename from UploadFile
            model="whisper-large-v3",
            response_format="json",
            language="en",
        )

        logger.info(f"Whisper Transcription: {transcription.text}")
        return JSONResponse({"transcription": transcription.text})

    except Exception as e:
        logger.error(f"Groq Whisper API Error: {e}")
        raise HTTPException(status_code=500, detail="Error transcribing audio")

@app.post("/process_text")
async def process_text(payload: dict):
    user_text = payload.get("text")
    groq_api_key = payload.get("groq_api_key")
    rime_api_key = payload.get("rime_api_key")
    if not user_text:
        raise HTTPException(status_code=400, detail="No text provided")
    if not groq_api_key or not rime_api_key:
        raise HTTPException(status_code=400, detail="API keys are required")

    logger.info(f"Received User Text: {user_text}")

    groq_response = await get_groq_response(user_text, groq_api_key)
    if not groq_response:
        raise HTTPException(status_code=500, detail="Failed to get response from Groq. Please check your Groq API key.")

    logger.info(f"Groq Response: {groq_response}")

    tts_data = await get_rime_tts_stream(groq_response, rime_api_key)
    if not tts_data:
        raise HTTPException(status_code=500, detail="Failed to get TTS from Rime.ai. Please check your Rime API key.")

    logger.info("Returning TTS data to frontend")

    # Encode audio data to base64
    tts_base64 = base64.b64encode(tts_data).decode('utf-8')

    # Return JSON response with AI text and audio data
    return JSONResponse(content={"response_text": groq_response, "audio_data": tts_base64})

async def get_groq_response(user_text, groq_api_key):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama-3.2-11b-text-preview",
        "messages": [
        {"role": "system", "content": "you are a voice based assistant. answers in a friendly tone and keey your answers short and to the point. always answer in a sentences and like a natural conversation"},
        {"role": "user", "content": user_text}
    ],
        "stream": False,
        "temperature": 0.5,
        "max_tokens": 100,
    }

    try:
        timeout = aiohttp.ClientTimeout(total=15)  # Set a timeout
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    error_content = await response.text()
                    logger.error(f"Groq API Error {response.status}: {error_content}")
                    return None
    except asyncio.TimeoutError:
        logger.error("Request to Groq API timed out.")
        return None
    except aiohttp.ClientError as e:
        logger.error(f"Groq API Client Error: {e}")
        return None

async def get_rime_tts_stream(text, rime_api_key):
    url = "https://users.rime.ai/v1/rime-tts"
    headers = {
        "Accept": "audio/mp3",
        "Authorization": f"Bearer {rime_api_key}",
        "Content-Type": "application/json",
    }

    for speaker_id in ["Colby", "mist", "english-female-colby"]:
        payload = {
            "speaker": speaker_id,
            "text": text,
            "modelId": "v1",
            "samplingRate": 22050,
            "speedAlpha": 1.0,
            "reduceLatency": True, #changed this from false to true
        }

        try:
            timeout = aiohttp.ClientTimeout(total=15)  # Set a timeout
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        tts_data = await response.read()
                        logger.info(f"Received TTS data from Rime.ai using speaker: {speaker_id}")
                        return tts_data
                    else:
                        # Read error content only if the response is in text format
                        content_type = response.headers.get('Content-Type', '')
                        if 'application/json' in content_type or 'text' in content_type:
                            error_content = await response.text()
                        else:
                            error_content = "<Non-text response content>"
                        logger.error(f"Rime.ai API Error {response.status}: {error_content}")
                        if response.status == 400:
                            logger.warning(f"Bad Request: {error_content}. Trying next speaker...")
                        continue  # Try next speaker

        except asyncio.TimeoutError:
            logger.error(f"Request to Rime.ai timed out for speaker: {speaker_id}")
            continue  # Try next speaker

        except aiohttp.ClientError as e:
            logger.error(f"Rime.ai API Client Error: {e}, Speaker: {speaker_id}")
            return None

    logger.error("Failed to get TTS from Rime.ai after trying all speakers.")
    return None
