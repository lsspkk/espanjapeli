# V5 Draft Roadmap

## Polysemous Words Issue

### Problem: One-to-Many Mappings

Current system assumes 1:1 word mappings (Spanish ↔ Finnish). Real language has polysemy.

**Example Case: "tiempo"**
- Database: `tiempo` = `aika` (time)
- Story context: `tiempo` = `sää` (weather)
- Both translations are correct in different contexts

**Metadata:**
- Word: `tiempo` / `el tiempo`
- Database location: `svelte/src/lib/data/words.ts:376`
- Story: `weather-talk` (Keskustelua säästä)
- Story phrase: "¡Qué buen tiempo hace hoy!" → "Mikä hieno sää tänään!"
- Database translation: `aika` (time)
- Story translation: `sää` (weather)

### Current System Limitations

**Dictionary (`words.ts`):**
- Single entry per Spanish word
- One Finnish translation only
- No context differentiation
- Category-based organization doesn't solve polysemy

**Knowledge Tracking (`wordKnowledge.ts`):**
- Tracks by Spanish word string
- Assumes single meaning per word
- Score applies to word regardless of context
- Cannot differentiate: "tiempo" as time vs weather

**Game Mechanics:**
- Word matching game shows one translation
- User learns "tiempo = aika" OR "tiempo = sää", not both
- No context clues in matching game
- Stories teach different meaning than database

### Questions

1. How should dictionary handle multiple meanings?
   - Multiple entries with same Spanish word?
   - Context field in word object?
   - Separate word variants?

2. How should knowledge tracking differentiate meanings?
   - Track `tiempo:aika` and `tiempo:sää` separately?
   - Single score with context awareness?
   - Ignore polysemy, accept ambiguity?

3. How should games present polysemous words?
   - Show context in matching game?
   - Accept multiple correct answers?
   - Filter by story context?

4. What's the scope of this issue?
   - How many words affected?
   - Is it worth architectural change?
   - Or just document as known limitation?

---

## Similar Findings

### Polysemous Words Detected

**Total identified:** 1 (from consistency validation)

1. **tiempo** - time/weather (documented above)

### Words Needing Investigation

_(To be populated as more polysemous cases are discovered)_

---

## Ideas for New Game Modes

### "¿Qué dijo?" / "Mitä hän sanoi?" / "What did you say?"

A new dialogue-based learning game using Tatoeba sentence pairs.

**Data Source:**
- Tatoeba trilingual corpus (CC-BY 2.0 FR)
- 8,238 unique Spanish-Finnish-English sentence triples
- Sentences range from 1-26 words, average 5.5 words
- Natural, everyday conversation phrases

**Game Concept:**
- Present Spanish sentences in context
- User practices listening/reading comprehension
- Multiple choice or fill-in-the-blank format
- Progressive difficulty based on sentence length

**Potential Variations:**
1. Listen and translate (Spanish → Finnish)
2. Read and match (Spanish sentence → Finnish translation)
3. Dialogue builder (arrange sentences into conversations)
4. Context-based learning (group related sentences by theme)

**Data Location:**
- Raw data: `scripts/data_story_pipeline/data/tatoeba_spa_fin_eng.json`
- Pipeline: `scripts/data_story_pipeline/download_tatoeba.py`

**Next Steps:**
- [ ] Filter sentences by difficulty/CEFR level
- [ ] Group sentences by topic/theme
- [ ] Create dialogue sequences from related sentences
- [ ] Design game mechanics and UI
- [ ] Transform data to game format

---

## Next Steps

- [ ] Audit vocabulary database for common polysemous words
- [ ] Analyze story contexts vs database translations
- [ ] Decide on architectural approach
- [ ] Prototype solution if warranted
- [ ] Document decision and rationale
