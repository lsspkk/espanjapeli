# Espanjapeli - Spanish Learning Game

> **Caution:** This project was developed using AI-assisted coding with Large Language Models (primarily Claude Sonnet 4.5). A human developer provided oversight and guidance, prioritizing functional implementation and rapid prototyping over strict software engineering standards. The codebase reflects an iterative, conversation-driven development process focused on creating a working educational tool.

A comprehensive Spanish language learning web application built with SvelteKit. Features multiple game modes, story-based learning, frequency-based vocabulary prioritization, and progress tracking.

## Features

### 🎮 Game Modes

- **Sanapeli**: Translation writing with contextual tips
- **Yhdistä sanat**: Word matching with visual feedback
- **Tarinat**: Story-based reading comprehension with 38 CEFR-aligned stories (A1, A2, B1)
- **Kids modes**: Pipsan maailma (emoji matching), Pipsan ystävät (character recognition)

### 📊 V4 Enhancements

- **Frequency-Based Learning**: Prioritize the most common Spanish words (top 5000)
- **Smart Word Selection**: Focus on high-frequency vocabulary for faster learning
- **Progress Tracking**: Detailed statistics on vocabulary mastery
- **Story Integration**: 38 stories across CEFR levels with vocabulary tracking
- **Mobile-First Design**: Optimized reading experience for mobile devices
- **Data Export/Import**: Backup and restore your learning progress
- **Milestone Celebrations**: Celebrate learning achievements

### 🎯 Learning Features

- Unified word knowledge tracking across all game modes
- Adaptive word selection based on your performance
- CEFR level estimation (A1-C2)
- Frequency badges showing word importance
- Post-game frequency summaries
- Story vocabulary integration with main vocabulary
- Settings for TTS (text-to-speech), themes, and game preferences

## Technology Stack

- **Frontend**: SvelteKit 2.49.4, Svelte 5.46.1
- **Styling**: Tailwind CSS 4.1.17, DaisyUI 5.5.14
- **Testing**: Vitest 4.0.16
- **Data**: Static JSON files, localStorage for progress
- **Python Scripts**: Data processing, story generation, translations

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for data processing scripts)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/espanjapeli.git
cd espanjapeli
```

2. Install frontend dependencies:
```bash
cd svelte
npm install
```

3. Install Python dependencies (for scripts):
```bash
pip install -r requirements.txt
```

### Running the Application

Development mode:
```bash
cd svelte
npm run dev
```

Build for production:
```bash
cd svelte
npm run build
npm run preview
```

### Running Tests

```bash
cd svelte
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Visual test runner
```

## Data Pipeline

Python scripts in `scripts/` folder handle data processing:

### Frequency Data
- `data_pipeline/download_frequency.py` - Download Spanish frequency lists
- `data_pipeline/filter_frequency.py` - Generate tiered frequency files
- `data_pipeline/enrich_words.py` - Add frequency data to vocabulary

### Story Generation
- `generate_stories.py` - Create new stories from templates
- `translate_stories.py` - Translate stories to Finnish
- `migrate_stories.py` - Migrate stories to new format
- `enrich_story_vocabulary.py` - Add frequency data to story vocabulary
- `generate_vocabulary_index.py` - Create word-to-story index

### Translation Services
- `generate_translations_azure.py` - Azure Translator API
- `generate_translations.py` - Local LLM via Ollama

### Configuration

For Python scripts, create `scripts/.env`:
```
AZURE_TRANSLATOR_KEY=your_key_here
AZURE_TRANSLATOR_REGION=your_region
OLLAMA_HOST=http://localhost:11434
```

## Project Structure

```
espanjapeli/
├── svelte/                      # Frontend application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/      # Svelte components
│   │   │   ├── services/        # Business logic
│   │   │   ├── stores/          # State management
│   │   │   ├── data/            # Static data
│   │   │   └── types/           # TypeScript types
│   │   ├── routes/              # SvelteKit routes
│   │   └── tests/               # Test files
│   └── static/
│       ├── stories/             # Story JSON files
│       └── data/                # Frequency data
├── scripts/                     # Python data processing
│   └── data_pipeline/           # Data pipeline scripts
├── docs/                        # Documentation
└── ai-control/                  # AI agent instructions
```

## Data Sources and Attributions

All data sources are open source and properly attributed:

- **Spanish Frequency Data**: Hermit Dave's Word Frequency Lists (CC-BY 4.0)
- **Finnish Frequency Data**: Institute for the Languages of Finland (CC-BY 4.0)
- **Story Content**: Original content and adaptations from open sources

See `/tietoja` page in the application for complete attributions and licenses.

## Development Principles

This project follows these principles:

- **Simple is Better**: Start simple, refactor when needed
- **Mobile-First**: Optimized for mobile devices
- **Test Coverage**: Focus on critical paths and user behavior
- **No Backend**: Static files only, localStorage for progress
- **Open Source**: All content sources are properly attributed

See `ai-control/PRINCIPLES.md` for detailed development guidelines.

## Contributing

This is a personal learning project, but suggestions and bug reports are welcome via issues.

## Legal Notice

**Copyright Notice:** Some AI-generated materials in this project may contain elements that could be considered derivative works. The Peppa Pig-related content in kids' modes is for educational purposes only and is not affiliated with or endorsed by the official Peppa Pig franchise. Users should exercise caution when using or distributing such materials.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Everyone is free to use, modify, and distribute this code, subject to the copyright notices above.

## Version History

See [VERSION_HISTORY.md](VERSION_HISTORY.md) for release notes and changelog.

---

**Current Version**: 4.0.0  
**Last Updated**: January 2026