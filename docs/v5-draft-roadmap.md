# V5 Draft Roadmap

# Datamodel refactoring

We need to solve the Polysemous Words Issue

### Problem Statement

The current system assumes 1:1 word mappings, but real language has polysemy - one surface form can have multiple distinct meanings. This affects both directions:

**Spanish → Finnish:**
- `tiempo` → `aika` (time) vs `sää` (weather)
- `banco` → `pankki` (bank) vs `penkki` (bench)

**Finnish → Spanish:**
- `aika` → `tiempo` (time) vs `bastante` (quite/fairly)
- `kieli` → `lengua` (tongue) vs `idioma` (language)

When a user learns "tiempo = sää" in a weather story, that knowledge shouldn't count toward knowing "tiempo = aika" for time expressions. These are distinct word-sense pairs requiring separate tracking.

### Current Data Model

**Word interface (`words.ts`):**

```ts
export interface Word {
  spanish: string;
  english: string;
  finnish: string;
  learningTips?: string[];
  id?: string;           // Already exists but unused
  frequency?: FrequencyData;
  linguistic?: LinguisticData;
}
```

**Knowledge store (`wordKnowledge.ts`):**

```ts
export interface WordKnowledgeData {
  version: number;
  words: Record<string, WordKnowledgeBidirectional>;  // Keyed by Spanish word
  gameHistory: GameRecord[];
  meta: { ... };
}
```

**How games record answers:**

```ts
wordKnowledge.recordAnswer(
  currentWord.spanish,  // Key: "tiempo"
  currentWord.finnish,  // Ignored for keying
  direction,
  quality,
  mode
);
```

The problem: knowledge is keyed by `spanish` string alone. Two Word entries with the same `spanish` but different `finnish` meanings would overwrite each other's progress.

### MVP Solution: Sense-Aware Word IDs

Add a `senseKey` field and make `id` required for polysemous words. Change knowledge tracking from Spanish-string keys to word-ID keys.

#### 1. Extend Word Interface

```ts
export interface Word {
  spanish: string;
  english: string;
  finnish: string;
  
  // Required for polysemous words, optional for others
  id?: string;
  
  // Human-readable sense disambiguator (optional)
  senseKey?: string;  // e.g., "tiempo#weather" vs "tiempo#time"
  
  learningTips?: string[];
  frequency?: FrequencyData;
  linguistic?: LinguisticData;
}
```

**ID format convention:** `{spanish}#{sense}` for polysemous words

Examples:
- `{ id: "tiempo#time", spanish: "tiempo", finnish: "aika", senseKey: "time" }`
- `{ id: "tiempo#weather", spanish: "tiempo", finnish: "sää", senseKey: "weather" }`
- `{ id: "banco#financial", spanish: "banco", finnish: "pankki", senseKey: "financial" }`
- `{ id: "banco#furniture", spanish: "banco", finnish: "penkki", senseKey: "furniture" }`

For non-polysemous words, `id` defaults to `spanish` value when not specified.

#### 2. Change Knowledge Store Key

Update `WordKnowledgeData.words` to key by word ID instead of Spanish string:

```ts
export interface WordKnowledgeData {
  version: number;
  words: Record<string, WordKnowledgeBidirectional>;  // Now keyed by Word.id
  // ...
}
```

This enables separate tracking:
- `words["tiempo#time"]` → knowledge for tiempo=aika
- `words["tiempo#weather"]` → knowledge for tiempo=sää

#### 3. Helper Function for ID Resolution

Add a utility to get the effective ID for any word:

```ts
function getWordId(word: Word): string {
  return word.id ?? word.spanish;
}
```

This maintains backward compatibility: words without explicit `id` use their `spanish` value.

#### 4. Update Game Record Calls

Change from:

```ts
wordKnowledge.recordAnswer(currentWord.spanish, currentWord.finnish, direction, quality, mode);
```

To:

```ts
wordKnowledge.recordAnswer(getWordId(currentWord), currentWord.finnish, direction, quality, mode);
```

Affected locations:
- `routes/yhdistasanat/+page.svelte` (2 calls)
- `routes/sanapeli/+page.svelte` (1 call)
- `routes/pipsan-maailma/+page.svelte` (1 call)
- `routes/pipsan-ystavat/+page.svelte` (1 call)
- `routes/tarinat/[storyId]/+page.svelte` (recordStoryEncounter)

#### 5. Data Migration

On load, detect old data (keys are plain Spanish words) and migrate:

```ts
function migrateToWordIds(oldData: WordKnowledgeData): WordKnowledgeData {
  const newWords: Record<string, WordKnowledgeBidirectional> = {};
  
  for (const [oldKey, knowledge] of Object.entries(oldData.words)) {
    // Old key is Spanish word. Find matching Word entry.
    const matchingWords = getAllWords().filter(w => w.spanish === oldKey);
    
    if (matchingWords.length === 1) {
      // Unambiguous: use word's id (or spanish as fallback)
      const newKey = matchingWords[0].id ?? oldKey;
      newWords[newKey] = knowledge;
    } else if (matchingWords.length > 1) {
      // Polysemous: pick first match, user's stats apply to primary sense
      const newKey = matchingWords[0].id ?? oldKey;
      newWords[newKey] = knowledge;
    } else {
      // No match (word removed from database): preserve with old key
      newWords[oldKey] = knowledge;
    }
  }
  
  return { ...oldData, words: newWords, version: NEXT_VERSION };
}
```

### Bidirectional Considerations

The `{spanish}#{sense}` ID format naturally supports Finnish polysemy lookups:

- When showing Finnish word "aika", find all Words where `finnish === "aika"`
- This returns both `tiempo#time` and potentially other Spanish words meaning "aika"
- Each has separate knowledge tracked by its unique ID

For reverse direction games (Finnish → Spanish), the same Word entries work because the ID uniquely identifies the word-sense pair regardless of direction.

### Implementation Steps

1. Add `senseKey` to `Word` interface
2. Add `getWordId()` helper function
3. Create polysemous word entries in `words.ts` for known cases (tiempo, banco, etc.)
4. Update `recordAnswer()` signature to use word ID
5. Update all game components to pass `getWordId(word)` instead of `word.spanish`
6. Add migration function for existing user data
7. Bump data model version

### Known Polysemous Words

| Spanish | Sense | Finnish | Proposed ID |
|---------|-------|---------|-------------|
| tiempo | time | aika | tiempo#time |
| tiempo | weather | sää | tiempo#weather |
| banco | financial | pankki | banco#financial |
| banco | furniture | penkki | banco#furniture |

_(To be expanded as more cases are identified)_

---



# New Game Mode "¿Qué dijiste?" / "Mitä sä sanoit?" / "What did you say?"

Route: /mita-sa-sanoit

A new dialogue-based learning game using Tatoeba sentence pairs.
Basically we want user to only hear some audio, and then after some time
to be able to indicate that they understood what was said.
This game mode should also be playable in silent mode. So the sentence is read first.
Then after some time the possible answers appear.


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
3. Context-based learning (group related sentences by theme)

**Data Location:**
- Raw data: `scripts/data_story_pipeline/data/tatoeba_spa_fin_eng.json`
- Pipeline: `scripts/data_story_pipeline/download_tatoeba.py`

**UX consideration**

Quiz phase must always prompt or use TTL to say the word, and then pause. 
For example stepwise Multiple‑Choice (best overall for mobile)
   How it works:
   Show prompt alone (e.g. perro → ?)
   Pause ~3–4 seconds (configurable in general game settings)
   Then reveal multiple‑choice answers

Why it works:
   Forces covert recall first
   Retains touch‑friendly UX
   Demonstrated to significantly improve vocabulary retention in adults and children compared to normal MCQ 


The question promt must be a new common svelte component, this game mode uses basic components.

**First Steps**

We need some nice grouping of the sentences.
Also many sentences are quite close to eachother,
so we idk if user should be able to select per game session to either use or not use similar sentences. 

- [ ] Filter sentences by difficulty/CEFR level
- [ ] Group sentences by topic/theme
- [ ] Create dialogue sequences from related sentences
      Fill the gaps by just improvising, generating story,
      because this game is LLM generated, some "fluff" in between is ok,
      that can be in spanish and also in simply translated finnish.
      This should be saved for this game mode statistic data.
- [ ] Transform data to game format



# New Game Mode "Palabras" "Valitut sanat" / "Keywords"

Route: /valitut-sanat

The game mode named like this could be called selected vocabulary, we use slang
to make it sound more fun.
In this game mode we want lessons based on
curated set of words and assistance from our new tatoeba phrases material.
Datamodel saves the lesson structure: words and phrases used in each lesson.
The lesson first teaches the words, then tests the knowledge.

Also this game mode must keep track of previous games played, and its home page
suggests repeating some recently learned category/selection/topic according to the
recommended repetition interval in language learing science. This is documented in file
svelte/src/routes/kielten-oppiminen/+page.svelte

The repetition of topic must use info about if the words were learned well or not in
previous games.
The knowledge tracking must be shared with other game modes.


The foundation of the learning game is progressing through words in order of usefulness:
how often they appear in real life language use.

The game mode structure is as follows, each has UX optimized for vertically held mobile device,
so they are kind of like lists, not containing many extra ux elements, mostly text, and perhaps
icons or buttons with little text. And on top theres progress bar and close button.

TeachState one: vocabulary teaching phase
First, a list of words from a category is shown, for example pronouns, colors, adjectives, verbs.
Short list, hopefully all in the category, but if not, then need to make two lessons for it.
The first has most common words, the second has less common words.


TeachState two: vocabulary teaching with example phrases

Then, a few short phrases are shown for each word.
Tthese phrases can be chosen from the new material that we have downloaded
from Tatoeba sentences, and the licence must of course be mentioned in the licences
user interface, and also in the relevant code, and also in the common licence info
of this git repo, when v5 is being implemented.


Then quiz phase begins:

Stepwise Multiple‑Choice (best overall for mobile)
   How it works:
   Show prompt alone (e.g. perro → ?)
   Pause ~3–4 seconds (configurable in general game settings)
   Then reveal multiple‑choice answers

Why it works:
   Forces covert recall first
   Retains touch‑friendly UX
   Demonstrated to significantly improve vocabulary retention in adults and children compared to normal MCQ 


The question promt must be a new common svelte component, this game mode uses basic components.


# Game mode refactoring

Yhdistäsanat quizz needs refactoring to adapt into this:

Stepwise Multiple‑Choice (best overall for mobile)
   How it works:
   Show prompt alone (e.g. perro → ?)
   Pause ~3–4 seconds (configurable in general game settings)
   Then reveal multiple‑choice answers

Why it works:
   Forces covert recall first
   Retains touch‑friendly UX
   Demonstrated to significantly improve vocabulary retention in adults and children compared to normal MCQ 


Pipsan maailma and pipsan ystävät also need this refactoring.
Here the ux will just show the top part of question game state,
that has the word, and with a small delay reveal the answer area.
There should be small kid frienldy animation that kids love to see
when waiting for the answers to appear.

The delay for this timer should be easily switchable in these game home pages,
with very simple ui, perhaps with the graphics that was used in the timer animation
component would be similar to the one that adjusts it.
This requires at least two new components for the kids games:

Implement a reusable **Counted Token Counter** component used both as
1. a **waiting animation** before multiple-choice answers are revealed
* Mobile-first, horizontal or vertical layout.
* Displays 1–3 discrete tokens, appearing one per second or faster depending of selected delay.
* After the last token appears, wait ~200 ms, then reveal the answer area.

2. a **delay selector UI** on game home pages.
* Mobile-first, horizontal layout.
* Each token represents one second of covert recall time.
* Delay value (0–3 s) for kids game modes is configured individually per game mode,
and saved to local storage.

**Theming**
* Tokens are themeable (e.g. dots, eggs, mud puddles, raindrops, suns).
* Theme affects visuals only (SVG / CSS / micro-motion), not logic.
* Support kid-friendly themes (Pipsan maailma / Pipsan ystävät).
* The game chooses animation by random, and tries not to repeat the same theme twice in a row.

