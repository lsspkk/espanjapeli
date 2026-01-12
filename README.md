# Espanjapeli - Spanish learning game

> **Caution:** This project was developed using AI-assisted coding with Large Language Models (primarily Claude Sonnet 4.5). A human developer provided oversight and guidance, prioritizing functional implementation and rapid prototyping over strict software engineering standards. The codebase reflects an iterative, conversation-driven development process focused on creating a working educational tool.

This is a language learning game that uses local LLMs (via Ollama) to generate contextual tips and translations for learning Spanish vocabulary. The game presents Spanish words and provides hints in your native language (Finnish/English) to help you understand and memorize the meanings. Tips are generated using AI models and cached for fast retrieval during gameplay.

In this vibe coding fantasy, AI agents created the game's material, crafting questions and selecting emojis with neural finesse. However, the resulting animations succumbed to hallucinations, birthing abstract pirouettes, and pictorial endeavors yielded mumbo jumbo symphonies. The polite eccentricities enhance the game's pedagogical charm, infusing it with modern day AI aura. Artistic or not, you decide.



All Python scripts are located in the `scripts/` folder, and include some local llm usage.

     test_one_word.py
     test_three_hints.py
     test_azure_translation.py
     generate_tips.py
     generate_translations.py
     generate_translations_azure.py

## Game

Espanjapeli is a SvelteKit application with multiple game modes for Spanish learning. Uses component-based architecture with Svelte stores for state management.

Game modes:
- Sanapeli: Translation writing
- Yhdistä sanat: Word matching
- Kielten oppiminen: Language exercises
- Tarinat: Story-based reading comprehension
- Kids modes: Pipsan maailma (emoji matching), Pipsan ystävät (character recognition)

Features unified knowledge tracking, progress motivation, and adaptive word selection.

### Configuration

Translation services:
- Azure Translator: Requires API key in `scripts/.env`
- Local LLM: Ollama with llama3.2:3b model

Ollama setup: Pull model, set host/port in scripts and browser env.

## Legal Warning

**Copyright Notice:** The AI-generated materials, including graphics, animations, and content within this project, may contain elements that infringe upon existing copyrights. Specifically, certain Peppa Pig-related graphics and assets, although poorly implemented and of substandard quality, could be identifiable as derivative works of official Peppa Pig intellectual property. Users are strongly advised against using, distributing, or reproducing this material in any form to mitigate potential legal liabilities. The developers disclaim any responsibility for copyright violations arising from the use of AI-generated content. All in all, the material created by AI is just so bad, that this game should not be taken seriously in any way.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Everyone is free to use, modify, and distribute this code.