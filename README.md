# Espanjapeli - Spanish learning game

This is a language learning game that uses local LLMs (via Ollama) to generate contextual tips and translations for learning Spanish vocabulary. The game presents Spanish words and provides hints in your native language (Finnish/English) to help you understand and memorize the meanings. Tips are generated using AI models and cached for fast retrieval during gameplay.

Because translation in Azure is so much faster, that is also supported.

## Commands to generate tips and translations

All Python scripts are located in the `scripts/` folder:

     test_one_word.py
     test_three_hints.py
     test_azure_translation.py
     generate_tips.py
     generate_translations.py
     generate_translations_azure.py

## Game

The game is located in `game/` and consists of HTML/CSS/JavaScript files that run in the browser. The `words_tips_translations.json` file contains all Spanish words with their translations and pre-generated learning tips organized by categories and difficulty levels (easy, medium, hard). The game uses a tip service that checks the JSON cache first before calling the LLM for new hints. User preferences and game history are stored in browser localStorage for persistence across sessions. The game includes features like text-to-speech, scoring, and wrong answer tracking.

Hot-reload game development can be setup and started with the `run_server.sh` script.


## Game Structure

### Core Files
- `index.html` - Main game interface with start page, game area, and results screen
- `game.js` - Game logic and flow controller
  - Manages game state (42 questions per session)
  - Smart word selection with repeat prevention (last 5 words)
  - Scoring system (10/5/3/1 points based on tips used)
  - Answer validation with typo tolerance
- `tipService.js` - LLM integration and caching layer
  - Checks `words_tips_translations.json` for pre-generated tips first
  - Returns all available Finnish tips sorted by model preference (llama3.2:3b → azureTranslatorService)
  - Simulates thinking time (500ms-2s) for cached responses
  - Falls back to live Ollama API only when no cached tips exist
- `storage.js` - Browser localStorage persistence
  - Saves user preferences (auto-speak, category)
  - Stores last 20 game results with full statistics
  - Tracks frequently wrong words from last 10 games
- `words.js` - Word database loader and category management
- `messages.js` - Congratulation and sympathy messages in Spanish/Finnish
- `styles.css` - Responsive mobile-first design with flexbox layout

### Configuration

#### Azure Translator (for translation scripts)

If using Azure Translator for translations:
1. Copy `scripts/env.example` to `scripts/.env`
2. Add your Azure Translator API key and region
3. Get credentials from [Azure Portal](https://portal.azure.com/)

Note: The `scripts/.env` file is git-ignored and will never be committed.

#### Local LLM (Ollama)

- **Python scripts**: Edit `OLLAMA_HOST` and `OLLAMA_PORT` variables in `scripts/generate_tips.py` to point to your Ollama instance
- **Game (browser)**: Create `game/env.js` from `game/env.example.js` and set `OLLAMA_API_URL` to your Ollama endpoint

Ollama is a popular tool for running LLMs locally and can be downloaded from [ollama.ai](https://ollama.ai). After installation, pull the `llama3.2:3b` model with `ollama pull llama3.2:3b` and the API will be available at `http://localhost:11434`.

For WSL2 access from Windows, the Ollama API is available at `http://172.23.64.1:11434`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Everyone is free to use, modify, and distribute this code.