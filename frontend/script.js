// Constants for application states
const STATES = {
    LISTENING: 'Listening...',
    THINKING: 'Processing...',
    SPEAKING: 'Speaking...',
    IDLE: 'Idle',
    ERROR: 'Error'
};

// DOM elements
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const transcriptElement = document.getElementById('transcript');
const responseElement = document.getElementById('response');

// Speech recognition variables
let recognition;
let isProcessing = false;
let isSpeaking = false;

// Configuration
const BACKEND_URL = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    console.log("Initializing RTLM application...");
    updateUIState(STATES.IDLE);
    setupSpeechRecognition();
    startListening();
}

function setupSpeechRecognition() {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Your browser does not support speech recognition. Please use Chrome or Edge.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true; // Keep listening even after speech ends

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        console.log('User said:', transcript);
        recognition.stop(); // Stop recognition to process input
        processUserInput(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            // No speech was detected; restart recognition
            recognition.stop();
            recognition.start();
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            // User denied microphone access or service is not allowed
            updateUIState(STATES.ERROR);
            alert('Microphone access was denied. Please allow access and try again.');
        } else {
            // Handle other errors
            updateUIState(STATES.ERROR);
            // Optionally, restart recognition
            recognition.stop();
            recognition.start();
        }
    };
    
    recognition.onend = () => {
        if (!isProcessing && !isSpeaking) {
            recognition.start();
        }
    };
}

function startListening() {
    if (recognition) {
        recognition.start();
        updateUIState(STATES.LISTENING);
    }
}

// Helper function to convert base64 to Blob
function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    const sliceSize = 512;

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
}

async function processUserInput(transcript) {
    isProcessing = true;
    updateUIState(STATES.THINKING);
    transcriptElement.textContent = transcript;
    responseElement.textContent = ''; // Clear previous response

    try {
        // Send user transcript and API keys to the backend
        const processResponse = await fetch(`${BACKEND_URL}/process_text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: transcript,
                groq_api_key: groqApiKey,
                rime_api_key: rimeApiKey
            })
        });

        if (!processResponse.ok) {
            const errorText = await processResponse.text();
            throw new Error(`Processing Error: ${processResponse.statusText}: ${errorText}`);
        }

        // Parse the JSON response
        const jsonData = await processResponse.json();

        const aiResponseText = jsonData.response_text;
        const audioBase64 = jsonData.audio_data;

        // Display the AI response text
        responseElement.textContent = aiResponseText;

        // Decode the base64 audio data
        const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');

        // Play audio response
        await playAudioResponse(audioBlob);

    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
        updateUIState(STATES.ERROR);
    } finally {
        isProcessing = false;
    }
}

async function playAudioResponse(audioBlob) {
    isSpeaking = true;
    updateUIState(STATES.SPEAKING);

    // Stop recognition to prevent capturing TTS output
    if (recognition) {
        recognition.abort();
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
        console.log('Audio playback ended');
        isSpeaking = false;
        updateUIState(STATES.LISTENING);
        startListening();
    };

    audio.onerror = (err) => {
        console.error('Audio Playback Error:', err);
        updateUIState(STATES.ERROR);
        isSpeaking = false;
    };

    // Start playing the audio response
    await audio.play().catch(err => {
        console.error('Audio Playback Error:', err);
        updateUIState(STATES.ERROR);
        isSpeaking = false;
    });

    // Allow user to interrupt TTS playback by starting recognition after a short delay
    setTimeout(() => {
        if (recognition && !isProcessing) {
            recognition.start();
        }
    }, 500); // Delay can be adjusted as needed
}

function updateUIState(state) {
    statusText.textContent = state;
    switch(state) {
        case STATES.LISTENING:
            statusIcon.src = 'icons/mic.png';
            break;
        case STATES.THINKING:
            statusIcon.src = 'icons/thinking.png';
            break;
        case STATES.SPEAKING:
            statusIcon.src = 'icons/speaker.png';
            break;
        case STATES.IDLE:
            statusIcon.src = 'icons/mic.png';
            break;
        case STATES.ERROR:
            statusIcon.src = 'icons/error.png';
            break;
    }
}

// Remove the click event listener since we start listening on page load
// document.addEventListener('click', () => {
//     if (audioContext.state === 'suspended') {
//         audioContext.resume();
//     }
//     startListening();
// });
// ... existing code ...

// Variables to store user-provided API keys
let groqApiKey = '';
let rimeApiKey = '';

function initializeApp() {
    console.log("Initializing RTLM application...");
    updateUIState(STATES.IDLE);
    setupSpeechRecognition();

    // Add event listener to the start button
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', () => {
        // Retrieve API keys from input fields
        const groqApiKeyInput = document.getElementById('groq-api-key');
        const rimeApiKeyInput = document.getElementById('rime-api-key');
        groqApiKey = groqApiKeyInput.value.trim();
        rimeApiKey = rimeApiKeyInput.value.trim();

        // Validate API keys
        if (!groqApiKey || !rimeApiKey) {
            alert('Please enter both Groq and Rime API keys.');
            return;
        }

        // Hide the input fields and start button after starting
        document.querySelector('.api-keys-container').style.display = 'none';
        startButton.style.display = 'none';

        startListening();
    });
}
