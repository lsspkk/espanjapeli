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

## Next Steps

- [ ] Audit vocabulary database for common polysemous words
- [ ] Analyze story contexts vs database translations
- [ ] Decide on architectural approach
- [ ] Prototype solution if warranted
- [ ] Document decision and rationale
