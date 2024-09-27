# RTLM (Real Time Language Model)

RTLM is a real-time voice-based assistant application that leverages speech recognition and text-to-speech technologies to provide interactive and dynamic responses. Users can communicate with the application using voice commands, which are processed and responded to in real-time, enhancing user experience through seamless interaction.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
  - [Starting the Backend Server](#starting-the-backend-server)
  - [Starting the Frontend](#starting-the-frontend)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- **Continuous Speech Recognition**: Utilizes the browser's SpeechRecognition API to continuously listen for user input.
- **Real-time Processing**: Processes transcribed text through a backend server to generate appropriate responses.
- **Text-to-Speech (TTS)**: Converts AI-generated responses into audible speech using Rime.ai's TTS service.
- **User-Friendly Interface**: Displays real-time status updates, transcriptions, and responses for enhanced user interaction.
- **Error Handling**: Robust mechanisms to handle errors in speech recognition, API interactions, and audio playback.

## Prerequisites

### Backend

- **Python**: Version 3.8 or higher
- **pip**: Python package installer

### Frontend

- **Web Browser**: Google Chrome or Microsoft Edge (for optimal speech recognition support)
- **Local Web Server**: Required for serving frontend files (e.g., Python's SimpleHTTPServer)

## Installation

### Backend Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/rtlm.git
   cd rtlm/backend
   ```

2. **Create a Virtual Environment**

   It's recommended to use a virtual environment to manage dependencies.

   ```bash
   python -m venv venv
   ```

3. **Activate the Virtual Environment**

   - **Windows**

     ```bash
     venv\Scripts\activate
     ```

   - **macOS/Linux**

     ```bash
     source venv/bin/activate
     ```

4. **Install Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

   *If `requirements.txt` is not provided, install the necessary packages manually:*

   ```bash
   pip install fastapi uvicorn aiohttp python-dotenv groq
   ```

### Frontend Setup

1. **Navigate to Frontend Directory**

   ```bash
   cd ../frontend
   ```

2. **Install Dependencies**

   The frontend is a static application and does not require additional dependencies. Ensure all necessary assets are present.

## Configuration

### Backend Configuration

Since API keys are provided by the user through the frontend interface, there's no need for a `.env` file. Ensure that the backend server's CORS settings allow requests from the frontend.

1. **CORS Configuration**

   In `app.py`, ensure that the `allow_origins` matches the URL where the frontend is hosted (e.g., `http://localhost:8080`).

   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:8080"],  # Update with your frontend URL
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Frontend Configuration

1. **Backend URL**

   In `script.js`, ensure that the `BACKEND_URL` points to the correct backend server address.

   ```javascript
   const BACKEND_URL = 'http://localhost:8000';
   ```

   Update this if your backend server is hosted elsewhere.

## Running the Application

### Starting the Backend Server

1. **Navigate to Backend Directory**

   ```bash
   cd backend
   ```

2. **Activate Virtual Environment**

   Ensure the virtual environment is activated.

   - **Windows**

     ```bash
     venv\Scripts\activate
     ```

   - **macOS/Linux**

     ```bash
     source venv/bin/activate
     ```

3. **Run the Server**

   Use Uvicorn to start the FastAPI server.

   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

   - The `--reload` flag enables auto-reloading on code changes.
   - The server will be accessible at `http://localhost:8000`.

### Starting the Frontend

1. **Navigate to Frontend Directory**

   ```bash
   cd frontend
   ```

2. **Serve Frontend Files**

   Use Python's simple HTTP server to serve the frontend files.

   ```bash
   python -m http.server 8080
   ```

   - Access the frontend at `http://localhost:8080`.

## Usage

1. **Access the Application**

   Open your web browser (Google Chrome or Microsoft Edge) and navigate to `http://localhost:8080`.

2. **Enter API Keys**

   - Input your **Groq API Key** and **Rime.ai API Key** in the respective fields.
   - Click the **Start** button to initiate the application.

3. **Interact Using Voice**

   - The application will begin listening for your voice input.
   - Speak clearly into your microphone; the application will transcribe your speech, process it, and respond both with text and audible speech.
   - The status icon and text will update to reflect the current state (Listening, Thinking, Speaking, Idle, Error).

4. **View Transcripts and Responses**

   - Your spoken input will appear under the **Transcript** section.
   - AI-generated responses will appear under the **Response** section and will be spoken aloud.

## Project Structure

```
rtlm/
├── backend/
│   ├── app.py
│   ├── requirements.txt
├── frontend/
│   ├── index.html
│   ├── script.js
│   ├── styles.css
│   ├── icons/
│   │   ├── mic.png
│   │   ├── thinking.png
│   │   ├── speaker.png
│   │   └── error.png
```

- **backend/**: Contains the FastAPI backend server.
  - `app.py`: Main backend application code.
  - `requirements.txt`: Lists Python dependencies.
- **frontend/**: Contains the frontend application.
  - `index.html`: Main HTML file.
  - `script.js`: Frontend JavaScript logic.
  - `styles.css`: CSS styles for the frontend.
  - **icons/**: Contains status icons used in the UI (`mic.png`, `thinking.png`, `speaker.png`, `error.png`).

## Troubleshooting

- **Speech Recognition Not Working**

  - Ensure you are using a supported browser (Google Chrome or Microsoft Edge).
  - Check if the browser has permission to access the microphone.
  - Verify that your microphone is properly connected and not being used by another application.

- **Backend Server Errors**

  - Check the terminal running the backend server for error logs.
  - Ensure that you have entered valid API keys in the frontend.
  - Verify that the backend server is running on the correct host and port.

- **CORS Issues**

  - Ensure that the `allow_origins` in the backend's CORS middleware matches the frontend's URL.
  - Check browser console for CORS-related error messages.

- **Audio Playback Issues**

  - Ensure that the audio files returned from the backend are in a supported format (e.g., `audio/mpeg`).
  - Verify that the audio files are not corrupted.

## License

This project is licensed under the [MIT License](LICENSE).

---
