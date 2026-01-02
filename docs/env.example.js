// Environment configuration for Espanjapeli
// Copy this file to env.js and update with your settings

window.ENV = {

    // Set to true to enable local LLM for generating tips on-the-fly
    // Set to false to only use pre-translated cached tips (default if no env.js exists)
    OLLAMA_IN_USE: false,
    
    // Ollama API endpoint
    // Default: http://localhost:11434/api/generate
    // For WSL2 access from Windows: http://172.23.64.1:11434/api/generate
    OLLAMA_API_URL: 'http://localhost:11434/api/generate',
    
    // Model to use for tip generation (only used if OLLAMA_IN_USE is true)
    OLLAMA_MODEL: 'llama3.2:3b'
};

