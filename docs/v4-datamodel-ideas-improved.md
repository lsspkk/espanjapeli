# V4 Enhanced Data Model - Research & Implementation Guide

**Document Purpose:** Comprehensive research on available open-source datasets, proven datamodels from language learning platforms, and concrete implementation recommendations for Espanjapeli V4.

**Date:** January 12, 2026  
**Context:** Planning V4.0.0 with focus on getting the database architecture right before implementation.

Claude Opus 4.5

Prompt:

     just got @v4-datamodel-ideas.md done by some fellow, after you did write @v4-roadmap.md earlier. We are still in planning    │
 │   phase. It seems like dualingo and or memrise and anki cards are available through web. Perhaps you could analyze their       │
 │   datamodels better, or check if there is some downloadable json or xml or whatever database for example about mark davies     │
 │   corpus. and since this project is @PRINCIPLES.md svelte only frontend project, the datamodel and data that will be used      │
 │   should be open source or have proper licence. Could you do more sophisticadet v4-datamodel-ideas-improved.md and try to      │
 │   search if there would be some ready made model and or datasets available that could be downloaded with scripts and then use  │
 │   the downloaded data to improve dictionaries etc statistics of spanish language for the game version 4. Personally I think    │
 │   now its the time to get database right. Later on this kind of refactoring will be complicated. So do many web searches,      │
 │   write document, analyze how readily available data could be used etc. Dont worry if it takes long time. I know you can do    │
 │   it, step by step.  


---

## Executive Summary

**Key Findings:**

1. **Multiple high-quality open datasets exist** that can be legally used in this frontend-only project:
   - OpenSubtitles frequency lists (CC-BY-SA-4.0) - 50,000 Spanish words with frequency counts
   - Tatoeba sentences (CC-BY) - Example sentences with translations
   - Wiktionary extracts (CC-BY-SA-3.0) - Definitions, part-of-speech, IPA

2. **A unified vocabulary database is critical** - this should be implemented in V4.0, not delayed

3. **Frequency-based learning is the industry standard** - Top 1000 words cover ~85% of everyday Spanish

4. **The datamodel should be designed now** - Retrofitting frequency and CEFR data later is painful

**Recommendation:** Build a comprehensive static vocabulary database that can be bundled with the app, enriched from open sources via build scripts.

---

## Part 1: Available Open-Source Datasets

### 1.1 OpenSubtitles Frequency Lists (⭐ PRIMARY RECOMMENDATION)

**Source:** [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords)  
**License:** CC-BY-SA-4.0 (content), MIT (code)  
**Stars:** 1,400+ ⭐  
**Data Available:**
- Spanish (es): 50,000 most frequent words with occurrence counts
- Finnish (fi): 50,000 most frequent words with occurrence counts
- Many other languages supported

**Data Format:**
```
de 14459520
que 14421005
no 12379505
a 9549646
la 9125471
el 7531226
...
```

**Why This Is Ideal:**
- Based on movie/TV subtitles = conversational spoken Spanish
- Includes verb conjugations and common phrases
- Pre-ranked by frequency
- Both Spanish AND Finnish data available!
- Actively maintained, 2018 update available
- Can be downloaded and bundled as static JSON

**Download URLs:**
- Spanish: `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt`
- Finnish: `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fi/fi_50k.txt`

**Integration Script Approach:**
```python
# scripts/download_frequency_data.py
import requests
import json

def download_spanish_frequencies():
    url = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt"
    response = requests.get(url)
    
    words = {}
    for rank, line in enumerate(response.text.strip().split('\n'), 1):
        parts = line.split()
        if len(parts) >= 2:
            word = parts[0]
            count = int(parts[1])
            words[word] = {
                "rank": rank,
                "count": count,
                "cefr": estimate_cefr_from_rank(rank)
            }
    
    with open('svelte/static/data/spanish_frequency.json', 'w') as f:
        json.dump(words, f)

def estimate_cefr_from_rank(rank):
    """Estimate CEFR level based on frequency rank"""
    if rank <= 500: return "A1"
    if rank <= 1500: return "A2"
    if rank <= 3000: return "B1"
    if rank <= 5000: return "B2"
    return "C1"
```

---

### 1.2 Tatoeba Sentence Database (⭐ RECOMMENDED)

**Source:** [Tatoeba.org](https://tatoeba.org) / [GitHub](https://github.com/Tatoeba/tatoeba2)  
**License:** CC-BY (sentences contributed by users)  
**Data:** 10+ million sentences in 400+ languages with translations

**Available Downloads:**
- `sentences.csv` - All sentences with language codes
- `links.csv` - Translation links between sentences
- `sentences_with_audio.csv` - Sentences that have audio recordings
- Per-language exports: `spa/` (Spanish), `fin/` (Finnish)

**Download URL:** `https://downloads.tatoeba.org/exports/`

**Use Cases for Espanjapeli:**
1. Example sentences for vocabulary words
2. Sentence completion exercises
3. Translation practice
4. Listening comprehension with audio links

**Data Format Example:**
```csv
sentence_id	lang	text
123456	spa	Buenos días, ¿cómo estás?
123457	fin	Hyvää huomenta, mitä kuuluu?
```

**Spanish-Finnish Sentence Pairs:**
Tatoeba has Spanish-Finnish translation links available. These can be extracted to provide authentic example sentences for vocabulary.

**Integration Approach:**
```python
# Download and extract Spanish-Finnish sentence pairs
# Filter to sentences containing words from our vocabulary
# Store as JSON: { "word": [{"spanish": "...", "finnish": "..."}] }
```

---

### 1.3 Wiktionary Extracted Data (⭐ RECOMMENDED)

**Source:** [tatuylonen/wiktextract](https://github.com/tatuylonen/wiktextract)  
**Processed Data:** [kaikki.org](https://kaikki.org/dictionary/Spanish/)  
**License:** CC-BY-SA-3.0 (Wiktionary content)  
**Stars:** 1,000+ ⭐

**Available Data:**
- Word definitions (multiple senses)
- Part of speech
- Gender (for nouns)
- IPA pronunciation
- Etymology
- Example sentences
- Translations to many languages

**Data Format (JSON Lines):**
```json
{
  "word": "casa",
  "pos": "noun",
  "senses": [
    {
      "glosses": ["house", "home"],
      "tags": ["feminine"]
    }
  ],
  "sounds": [
    {"ipa": "/ˈkasa/"}
  ],
  "translations": [
    {"lang": "Finnish", "word": "talo"},
    {"lang": "English", "word": "house"}
  ]
}
```

**Download:** Pre-extracted Spanish data available at kaikki.org in JSON Lines format.

**Benefits:**
- Rich linguistic metadata (gender, conjugation, etymology)
- Human-curated translations
- IPA for pronunciation
- Multiple definitions per word
- Regularly updated

---

### 1.4 Wiktionary Frequency Lists

**Source:** [Wiktionary Frequency Lists](https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Spanish1000)  
**License:** CC-BY-SA-3.0  

**Available Lists:**
- Spanish 1000 most common words
- Spanish 2000-5000 words (various sublists)
- Based on multiple corpora

**Format:** HTML table, easily scraped.

**Note:** The OpenSubtitles data (hermitdave repo) is more comprehensive and easier to use, but Wiktionary provides a good cross-reference.

---

### 1.5 CEFR Vocabulary Standards

**Primary Source:** [English Vocabulary Profile](https://www.englishprofile.org/wordlists/evp) (methodology applicable to Spanish)

**Spanish CEFR Resources:**
- Instituto Cervantes Plan Curricular (official CEFR vocabulary lists for Spanish)
- Available as PDF, needs extraction

**GitHub Resources:**
- [cefr_vocabulary_spider](https://github.com/jialinxie/cefr_vocabulary_spider) - Scraper for EVP data
- [cefr-to-your-language](https://github.com/Danum-Dev/cefr-to-your-language) - CEFR translation tools

**Practical Approach:**
Since official Spanish CEFR lists are not easily machine-readable, use frequency rank as a proxy:

| Frequency Rank | Estimated CEFR | Vocabulary Size |
|---------------|----------------|-----------------|
| 1-500 | A1 | 500 words |
| 501-1500 | A2 | 1,000 words |
| 1501-3000 | B1 | 1,500 words |
| 3001-5000 | B2 | 2,000 words |
| 5001-8000 | C1 | 3,000 words |
| 8001+ | C2 | 3,000+ words |

This mapping is used by most language learning apps and aligns with research on vocabulary coverage.

---

### 1.6 Mark Davies Corpus (Analysis)

**Source:** [Corpus del Español](https://www.corpusdelespanol.org/)  
**License:** Academic use, requires registration

**Assessment for Espanjapeli:**
- ❌ Not freely redistributable
- ❌ Requires account/API access
- ❌ Terms of service may prohibit bundling in apps
- ✅ Top 5000 word list available for reference
- ✅ Can use for manual validation of our frequency data

**Recommendation:** Use OpenSubtitles data (hermitdave) instead - it's open source and provides similar quality frequency rankings for conversational Spanish.

---

### 1.7 Duolingo / Memrise Data Availability

**Research Findings:**

**Duolingo:**
- ❌ No public API for vocabulary data
- ❌ Proprietary word lists and courses
- ✅ Open-source [Duolingo API wrappers](https://github.com/topics/duolingo-api) exist but are for user progress tracking only
- ❌ Cannot legally extract or use their vocabulary data

**Memrise:**
- ❌ No public vocabulary export API
- ❌ User-created content has mixed licensing
- ❌ Community courses cannot be legally scraped

**Anki:**
- ⚠️ Shared decks have no standard license
- ⚠️ Many are based on copyrighted materials
- ✅ Some CC-licensed decks exist on GitHub
- ✅ Can use Anki's file format for export features

**Conclusion:** Cannot directly use data from Duolingo/Memrise/Anki. Must rely on properly licensed open datasets (OpenSubtitles, Wiktionary, Tatoeba).

---

## Part 2: Recommended Data Model Architecture

### 2.1 Core Vocabulary Database Schema

Based on industry best practices and available data:

```typescript
// svelte/src/lib/types/vocabulary.ts

/**
 * Core vocabulary entry with all metadata
 */
export interface VocabularyEntry {
  // Identification
  id: string;                    // Unique ID: "word_perro" or hash
  spanish: string;               // "perro"
  
  // Translations
  translations: {
    finnish: string[];           // ["koira"]
    english: string[];           // ["dog"]
  };
  
  // Linguistic metadata
  linguistic: {
    partOfSpeech: PartOfSpeech;  // "noun"
    gender?: "masculine" | "feminine" | "neuter";
    number?: "singular" | "plural";
    verbType?: "regular" | "irregular" | "reflexive";
    lemma?: string;              // Base form if this is inflected
    ipa?: string;                // "/ˈpero/"
  };
  
  // Frequency and level
  frequency: {
    rank: number;                // 1-50000 (from OpenSubtitles)
    rawCount?: number;           // Occurrence count in corpus
    cefrLevel: CEFRLevel;        // "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
    isTop100: boolean;
    isTop500: boolean;
    isTop1000: boolean;
    isTop3000: boolean;
  };
  
  // Context and examples
  context: {
    categories: string[];        // ["animals", "pets"]
    exampleSentences: ExampleSentence[];
    collocations?: string[];     // Common word combinations
    synonyms?: string[];
    antonyms?: string[];
  };
  
  // Learning metadata
  learning: {
    difficulty: number;          // 1-10 subjective difficulty
    commonMistakes?: string[];   // Common learner errors
    mnemonicTip?: string;        // Memory aid
  };
  
  // Usage tracking (populated at runtime)
  usage?: {
    appearsInStories: string[];  // Story IDs
    appearsInCategories: string[]; // Game category keys
  };
}

type PartOfSpeech = 
  | "noun" 
  | "verb" 
  | "adjective" 
  | "adverb" 
  | "pronoun"
  | "preposition" 
  | "conjunction" 
  | "interjection"
  | "article"
  | "phrase";

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

interface ExampleSentence {
  spanish: string;
  finnish: string;
  english?: string;
  source?: "tatoeba" | "story" | "manual";
  sourceId?: string;             // Tatoeba sentence ID or story ID
}
```

### 2.2 Vocabulary Index for Fast Lookups

```typescript
// svelte/static/data/vocabulary-index.json structure

interface VocabularyIndex {
  version: string;               // "1.0.0"
  generatedAt: string;           // ISO timestamp
  stats: {
    totalWords: number;
    wordsWithFrequency: number;
    wordsWithExamples: number;
  };
  
  // Frequency-based word lists (just IDs for lazy loading)
  frequencyLists: {
    top100: string[];
    top500: string[];
    top1000: string[];
    top3000: string[];
    top5000: string[];
  };
  
  // CEFR level lists
  cefrLists: {
    A1: string[];
    A2: string[];
    B1: string[];
    B2: string[];
    C1: string[];
  };
  
  // Category mappings
  categories: Record<string, {
    name: string;
    nameFinnish: string;
    wordIds: string[];
    icon: string;
  }>;
  
  // Word to context mappings
  wordToStories: Record<string, string[]>;
  storyToWords: Record<string, string[]>;
}
```

### 2.3 User Progress Data Model (Enhanced)

```typescript
// Extends existing wordKnowledge.ts

interface EnhancedWordProgress {
  wordId: string;                // Links to VocabularyEntry.id
  
  // Existing SM-2 based tracking
  score: number;                 // 0-100
  practiceCount: number;
  firstTryCount: number;
  secondTryCount: number;
  thirdTryCount: number;
  failedCount: number;
  lastPracticed: string;
  firstPracticed: string;
  
  // NEW: Context tracking
  encounterCount: number;        // Times seen across ALL contexts
  contexts: EncounterContext[];
  
  // NEW: Derived status
  masteryStatus: "new" | "learning" | "familiar" | "mastered";
  needsReview: boolean;          // Based on spaced repetition schedule
  dueDate?: string;              // Next review date
}

interface EncounterContext {
  type: "game" | "story" | "vocabulary";
  id: string;                    // Game type or story ID
  timestamp: string;
  result?: "correct" | "incorrect" | "viewed";
}

interface UserVocabularyStats {
  // Overall progress
  totalWordsEncountered: number;
  totalWordsMastered: number;    // score >= 80, practiceCount >= 5
  estimatedCEFRLevel: CEFRLevel;
  
  // Frequency-based progress
  frequencyProgress: {
    top100: { known: number; total: 100; percentage: number };
    top500: { known: number; total: 500; percentage: number };
    top1000: { known: number; total: 1000; percentage: number };
    top3000: { known: number; total: 3000; percentage: number };
  };
  
  // CEFR-based progress
  cefrProgress: {
    A1: { known: number; total: number; percentage: number };
    A2: { known: number; total: number; percentage: number };
    B1: { known: number; total: number; percentage: number };
    B2: { known: number; total: number; percentage: number };
  };
  
  // Learning velocity
  wordsPerWeek: number;
  currentStreak: number;
  longestStreak: number;
  
  // Next milestones
  nextMilestone: {
    type: "frequency" | "cefr";
    target: string;              // "top1000" or "A2"
    wordsNeeded: number;
    estimatedDays: number;
  };
}
```

---

## Part 3: Static Data File Structure

### 3.1 Proposed File Organization

```
svelte/static/
├── data/
│   ├── vocabulary/
│   │   ├── index.json              # Main vocabulary index
│   │   ├── words-a1.json           # A1 level words (full data)
│   │   ├── words-a2.json           # A2 level words
│   │   ├── words-b1.json           # B1 level words
│   │   ├── words-b2.json           # B2+ level words
│   │   └── frequency-top5000.json  # Frequency data only (lightweight)
│   │
│   ├── sentences/
│   │   ├── index.json              # Sentence index
│   │   └── spa-fin-pairs.json      # Spanish-Finnish sentence pairs
│   │
│   └── metadata/
│       ├── categories.json         # Category definitions
│       ├── part-of-speech.json     # POS tag mappings
│       └── cefr-thresholds.json    # CEFR level definitions
│
├── stories/                        # Existing structure
│   ├── index.json
│   ├── a1/
│   ├── a2/
│   └── b1/
│
└── themes/                         # Existing structure
```

### 3.2 Sample Vocabulary Data (words-a1.json)

```json
{
  "version": "1.0.0",
  "level": "A1",
  "wordCount": 500,
  "words": [
    {
      "id": "word_hola",
      "spanish": "hola",
      "translations": {
        "finnish": ["hei", "terve", "moi"],
        "english": ["hello", "hi"]
      },
      "linguistic": {
        "partOfSpeech": "interjection"
      },
      "frequency": {
        "rank": 89,
        "cefrLevel": "A1",
        "isTop100": true,
        "isTop500": true,
        "isTop1000": true,
        "isTop3000": true
      },
      "context": {
        "categories": ["greetings", "basic"],
        "exampleSentences": [
          {
            "spanish": "¡Hola! ¿Cómo estás?",
            "finnish": "Hei! Mitä kuuluu?",
            "source": "tatoeba",
            "sourceId": "123456"
          }
        ]
      },
      "learning": {
        "difficulty": 1,
        "mnemonicTip": "Sounds like 'Oh la!' - a greeting"
      }
    },
    {
      "id": "word_perro",
      "spanish": "perro",
      "translations": {
        "finnish": ["koira"],
        "english": ["dog"]
      },
      "linguistic": {
        "partOfSpeech": "noun",
        "gender": "masculine"
      },
      "frequency": {
        "rank": 847,
        "cefrLevel": "A1",
        "isTop100": false,
        "isTop500": false,
        "isTop1000": true,
        "isTop3000": true
      },
      "context": {
        "categories": ["animals", "pets"],
        "exampleSentences": [
          {
            "spanish": "El perro está en el jardín.",
            "finnish": "Koira on puutarhassa.",
            "source": "tatoeba"
          }
        ]
      },
      "learning": {
        "difficulty": 2
      }
    }
  ]
}
```

### 3.3 Frequency Index (frequency-top5000.json)

Lightweight file for quick frequency lookups:

```json
{
  "version": "1.0.0",
  "source": "OpenSubtitles 2018",
  "license": "CC-BY-SA-4.0",
  "words": {
    "de": { "rank": 1, "cefr": "A1" },
    "que": { "rank": 2, "cefr": "A1" },
    "no": { "rank": 3, "cefr": "A1" },
    "a": { "rank": 4, "cefr": "A1" },
    "la": { "rank": 5, "cefr": "A1" },
    "el": { "rank": 6, "cefr": "A1" },
    "y": { "rank": 7, "cefr": "A1" },
    "es": { "rank": 8, "cefr": "A1" },
    "en": { "rank": 9, "cefr": "A1" },
    "lo": { "rank": 10, "cefr": "A1" }
  }
}
```

---

## Part 4: Data Pipeline Scripts

### 4.1 Script Overview

```
scripts/
├── data_pipeline/
│   ├── download_frequency.py      # Download OpenSubtitles data
│   ├── download_tatoeba.py        # Download sentence pairs
│   ├── extract_wiktionary.py      # Process wiktextract data
│   ├── merge_data.py              # Combine all sources
│   ├── generate_vocabulary.py     # Generate final JSON files
│   ├── validate_data.py           # Validate output
│   └── update_words_ts.py         # Sync with existing words.ts
```

### 4.2 Download Frequency Data Script

```python
#!/usr/bin/env python3
"""
Download and process OpenSubtitles frequency data.
Source: github.com/hermitdave/FrequencyWords (CC-BY-SA-4.0)
"""

import requests
import json
from pathlib import Path

FREQUENCY_URLS = {
    "spanish": "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt",
    "finnish": "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fi/fi_50k.txt"
}

OUTPUT_DIR = Path("svelte/static/data/vocabulary")

def estimate_cefr(rank: int) -> str:
    """Estimate CEFR level from frequency rank."""
    if rank <= 500: return "A1"
    if rank <= 1500: return "A2"
    if rank <= 3000: return "B1"
    if rank <= 5000: return "B2"
    if rank <= 8000: return "C1"
    return "C2"

def download_frequency_list(language: str, url: str) -> dict:
    """Download and parse frequency list."""
    print(f"Downloading {language} frequency data...")
    response = requests.get(url)
    response.raise_for_status()
    
    words = {}
    for rank, line in enumerate(response.text.strip().split('\n'), 1):
        parts = line.split()
        if len(parts) >= 2:
            word = parts[0].lower()
            count = int(parts[1])
            words[word] = {
                "rank": rank,
                "count": count,
                "cefr": estimate_cefr(rank),
                "isTop100": rank <= 100,
                "isTop500": rank <= 500,
                "isTop1000": rank <= 1000,
                "isTop3000": rank <= 3000,
                "isTop5000": rank <= 5000
            }
    
    print(f"  Downloaded {len(words)} words")
    return words

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    for lang, url in FREQUENCY_URLS.items():
        words = download_frequency_list(lang, url)
        
        output_file = OUTPUT_DIR / f"frequency-{lang}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                "version": "1.0.0",
                "source": "OpenSubtitles 2018",
                "license": "CC-BY-SA-4.0",
                "language": lang,
                "wordCount": len(words),
                "words": words
            }, f, ensure_ascii=False, indent=2)
        
        print(f"  Saved to {output_file}")

if __name__ == "__main__":
    main()
```

### 4.3 Merge Existing Words with Frequency Data

```python
#!/usr/bin/env python3
"""
Merge existing words.ts vocabulary with frequency data.
Creates enhanced vocabulary files with all metadata.
"""

import json
import re
from pathlib import Path

def parse_words_ts(filepath: str) -> dict:
    """Parse TypeScript words.ts file to extract vocabulary."""
    # This would need a proper TS parser in production
    # Simplified regex-based extraction for demonstration
    pass

def merge_frequency_data(words: dict, frequency: dict) -> dict:
    """Add frequency metadata to existing words."""
    enhanced = {}
    
    for spanish, word_data in words.items():
        freq_data = frequency.get(spanish.lower(), {})
        
        enhanced[spanish] = {
            **word_data,
            "frequency": {
                "rank": freq_data.get("rank", 99999),
                "cefrLevel": freq_data.get("cefr", "C2"),
                "isTop100": freq_data.get("isTop100", False),
                "isTop500": freq_data.get("isTop500", False),
                "isTop1000": freq_data.get("isTop1000", False),
                "isTop3000": freq_data.get("isTop3000", False)
            }
        }
    
    return enhanced

def main():
    # Load existing words.ts data
    # Load frequency data
    # Merge and save enhanced vocabulary
    pass

if __name__ == "__main__":
    main()
```

---

## Part 5: Integration with Existing Codebase

### 5.1 Enhancing words.ts

Current `words.ts` structure:
```typescript
export interface Word {
  spanish: string;
  english: string;
  finnish: string;
  learningTips?: string[];
}
```

Enhanced structure (backwards compatible):
```typescript
export interface Word {
  // Existing fields (preserved)
  spanish: string;
  english: string;
  finnish: string;
  learningTips?: string[];
  
  // NEW: Optional fields for gradual migration
  id?: string;
  frequency?: {
    rank: number;
    cefrLevel: string;
  };
  linguistic?: {
    partOfSpeech: string;
    gender?: string;
  };
}
```

### 5.2 Vocabulary Service

```typescript
// svelte/src/lib/services/vocabularyService.ts

import type { VocabularyEntry } from '$lib/types/vocabulary';

class VocabularyService {
  private frequencyIndex: Map<string, number> = new Map();
  private cefrIndex: Map<string, string> = new Map();
  private loaded = false;
  
  /**
   * Load frequency data on first use
   */
  async initialize(): Promise<void> {
    if (this.loaded) return;
    
    const response = await fetch('/data/vocabulary/frequency-top5000.json');
    const data = await response.json();
    
    for (const [word, info] of Object.entries(data.words)) {
      this.frequencyIndex.set(word, info.rank);
      this.cefrIndex.set(word, info.cefr);
    }
    
    this.loaded = true;
  }
  
  /**
   * Get frequency rank for a word
   */
  getFrequencyRank(spanish: string): number {
    return this.frequencyIndex.get(spanish.toLowerCase()) ?? 99999;
  }
  
  /**
   * Get CEFR level for a word
   */
  getCEFRLevel(spanish: string): string {
    return this.cefrIndex.get(spanish.toLowerCase()) ?? "C2";
  }
  
  /**
   * Check if word is in top N most common
   */
  isInTopN(spanish: string, n: number): boolean {
    const rank = this.getFrequencyRank(spanish);
    return rank <= n;
  }
  
  /**
   * Get words the user should learn next (not yet mastered, high frequency)
   */
  getRecommendedWords(
    knownWords: Set<string>,
    count: number = 10
  ): VocabularyEntry[] {
    // Filter to unknown words
    // Sort by frequency rank
    // Return top N
    return [];
  }
}

export const vocabularyService = new VocabularyService();
```

### 5.3 Statistics Service

```typescript
// svelte/src/lib/services/statisticsService.ts

import { get } from 'svelte/store';
import { wordKnowledge } from '$lib/stores/wordKnowledge';
import { vocabularyService } from './vocabularyService';

interface VocabularyStatistics {
  totalWordsLearned: number;
  estimatedLevel: string;
  frequencyProgress: {
    top100: { known: number; total: 100; percent: number };
    top500: { known: number; total: 500; percent: number };
    top1000: { known: number; total: 1000; percent: number };
  };
  weeklyProgress: number;
  nextMilestone: {
    name: string;
    wordsNeeded: number;
  };
}

export function calculateVocabularyStatistics(): VocabularyStatistics {
  const knowledge = get(wordKnowledge);
  const knownWords = new Set(
    Object.keys(knowledge.words).filter(word => {
      const data = knowledge.words[word];
      // Consider "known" if score >= 70 in either direction
      return data.spanish_to_finnish.score >= 70 || 
             data.finnish_to_spanish.score >= 70;
    })
  );
  
  // Count how many top-N words are known
  let top100Known = 0;
  let top500Known = 0;
  let top1000Known = 0;
  
  for (const word of knownWords) {
    const rank = vocabularyService.getFrequencyRank(word);
    if (rank <= 100) top100Known++;
    if (rank <= 500) top500Known++;
    if (rank <= 1000) top1000Known++;
  }
  
  // Estimate CEFR level based on known high-frequency words
  let estimatedLevel = "A1";
  if (top1000Known >= 800) estimatedLevel = "B1";
  else if (top500Known >= 400) estimatedLevel = "A2";
  
  return {
    totalWordsLearned: knownWords.size,
    estimatedLevel,
    frequencyProgress: {
      top100: { known: top100Known, total: 100, percent: top100Known },
      top500: { known: top500Known, total: 500, percent: Math.round(top500Known / 5) },
      top1000: { known: top1000Known, total: 1000, percent: Math.round(top1000Known / 10) }
    },
    weeklyProgress: calculateWeeklyProgress(knowledge),
    nextMilestone: calculateNextMilestone(top100Known, top500Known, top1000Known)
  };
}

function calculateWeeklyProgress(knowledge: any): number {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return Object.values(knowledge.words).filter((w: any) => 
    new Date(w.spanish_to_finnish.firstPracticed) > oneWeekAgo
  ).length;
}

function calculateNextMilestone(
  top100: number, 
  top500: number, 
  top1000: number
): { name: string; wordsNeeded: number } {
  if (top100 < 100) {
    return { name: "100 yleisintä sanaa", wordsNeeded: 100 - top100 };
  }
  if (top500 < 500) {
    return { name: "500 yleisintä sanaa", wordsNeeded: 500 - top500 };
  }
  return { name: "1000 yleisintä sanaa", wordsNeeded: 1000 - top1000 };
}
```

---

## Part 6: UI Components for Statistics

### 6.1 Vocabulary Progress Widget

```svelte
<!-- svelte/src/lib/components/shared/VocabularyProgress.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { calculateVocabularyStatistics } from '$lib/services/statisticsService';
  
  let stats = $state<any>(null);
  
  onMount(async () => {
    stats = await calculateVocabularyStatistics();
  });
</script>

{#if stats}
<div class="card bg-base-100 shadow-lg">
  <div class="card-body">
    <h2 class="card-title text-lg">📊 Sanastosi</h2>
    
    <div class="stats stats-vertical">
      <div class="stat">
        <div class="stat-title">Opittuja sanoja</div>
        <div class="stat-value text-primary">{stats.totalWordsLearned}</div>
        <div class="stat-desc">Arvioitu taso: {stats.estimatedLevel}</div>
      </div>
    </div>
    
    <div class="space-y-2 mt-4">
      <div>
        <div class="flex justify-between text-sm">
          <span>Top 100 sanaa</span>
          <span>{stats.frequencyProgress.top100.known}/100</span>
        </div>
        <progress 
          class="progress progress-primary w-full" 
          value={stats.frequencyProgress.top100.percent} 
          max="100"
        ></progress>
      </div>
      
      <div>
        <div class="flex justify-between text-sm">
          <span>Top 500 sanaa</span>
          <span>{stats.frequencyProgress.top500.known}/500</span>
        </div>
        <progress 
          class="progress progress-secondary w-full" 
          value={stats.frequencyProgress.top500.percent} 
          max="100"
        ></progress>
      </div>
      
      <div>
        <div class="flex justify-between text-sm">
          <span>Top 1000 sanaa</span>
          <span>{stats.frequencyProgress.top1000.known}/1000</span>
        </div>
        <progress 
          class="progress progress-accent w-full" 
          value={stats.frequencyProgress.top1000.percent} 
          max="100"
        ></progress>
      </div>
    </div>
    
    <div class="alert alert-info mt-4">
      <span>
        Seuraava tavoite: {stats.nextMilestone.name}
        <br>
        <span class="text-sm">Vielä {stats.nextMilestone.wordsNeeded} sanaa</span>
      </span>
    </div>
  </div>
</div>
{/if}
```

---

## Part 7: Implementation Roadmap

### Phase 1: Data Foundation (V4.0 - Priority)

**Week 1-2: Data Pipeline**
- [ ] Create `scripts/data_pipeline/` folder
- [ ] Implement `download_frequency.py` script
- [ ] Download and process OpenSubtitles Spanish frequency data
- [ ] Download and process Finnish frequency data for reference
- [ ] Generate `frequency-top5000.json`

**Week 2-3: Vocabulary Enhancement**
- [ ] Add frequency data to existing `words.ts` categories
- [ ] Add `id` field to all words
- [ ] Add `partOfSpeech` to all words
- [ ] Add `gender` to nouns
- [ ] Generate vocabulary index JSON

**Week 3-4: Service Integration**
- [ ] Create `vocabularyService.ts`
- [ ] Create `statisticsService.ts`
- [ ] Add frequency lookups to game components
- [ ] Add CEFR level display

**Week 4-5: UI Components**
- [ ] Create VocabularyProgress widget
- [ ] Add statistics to home screen
- [ ] Add word frequency badges in games
- [ ] Add "top 1000" progress tracking

### Phase 2: Content Enrichment (V4.1)

**Tatoeba Integration:**
- [ ] Download Spanish-Finnish sentence pairs
- [ ] Match sentences to vocabulary words
- [ ] Display example sentences in word popups
- [ ] Add sentence-based exercises

**Wiktionary Integration:**
- [ ] Download Spanish wiktextract data
- [ ] Extract IPA pronunciations
- [ ] Add etymology information
- [ ] Improve translations

### Phase 3: Advanced Features (V4.5+)

**Spaced Repetition Enhancement:**
- [ ] Calculate review schedules based on frequency
- [ ] Prioritize high-frequency unknown words
- [ ] "Learn top 1000" focused mode

**Smart Recommendations:**
- [ ] Story recommendations based on vocabulary
- [ ] Adaptive difficulty in games
- [ ] Personalized word selection

---

## Part 8: Data Licensing Summary

| Dataset | License | Usage Rights | Attribution Required |
|---------|---------|--------------|---------------------|
| OpenSubtitles Frequency | CC-BY-SA-4.0 | ✅ Commercial OK | Yes, in app/docs |
| Tatoeba Sentences | CC-BY | ✅ Commercial OK | Yes, in app/docs |
| Wiktionary Extracts | CC-BY-SA-3.0 | ✅ Commercial OK | Yes, in app/docs |
| Wiktionary Lists | CC-BY-SA-3.0 | ✅ Commercial OK | Yes, in app/docs |
| Mark Davies Corpus | Academic | ❌ Not for bundling | N/A |
| Duolingo Data | Proprietary | ❌ Cannot use | N/A |
| Memrise Data | Mixed | ❌ Cannot use | N/A |

**Attribution Template (for app footer or about page):**
```
Frequency data from OpenSubtitles (CC-BY-SA-4.0)
Example sentences from Tatoeba (CC-BY)
Dictionary data from Wiktionary (CC-BY-SA-3.0)
```

---

## Part 9: Comparison with Other Language Apps

### Industry Standard Features

| Feature | Duolingo | Memrise | LingQ | Espanjapeli V3 | Espanjapeli V4 |
|---------|----------|---------|-------|----------------|----------------|
| Frequency rankings | ✅ | ✅ | ✅ | ❌ | ✅ Planned |
| CEFR levels | ✅ | ⚠️ | ✅ | ⚠️ Stories only | ✅ Planned |
| Words learned count | ✅ | ✅ | ✅ | ⚠️ Basic | ✅ Planned |
| Top 1000 progress | ❌ | ✅ | ✅ | ❌ | ✅ Planned |
| Part of speech | ✅ | ⚠️ | ✅ | ❌ | ✅ Planned |
| Example sentences | ✅ | ✅ | ✅ | ⚠️ Stories | ✅ Planned |
| Word in context | ✅ | ⚠️ | ✅ | ❌ | ✅ Planned |
| Cross-mode tracking | ✅ | ⚠️ | ✅ | ❌ | ✅ Planned |

### V4 Competitive Advantages

1. **Finnish as primary target language** - No major competitor focuses on Spanish→Finnish
2. **Offline-first** - All data bundled, no account required
3. **Open source** - Community can contribute and verify data
4. **Transparency** - Users can see exactly how progress is calculated
5. **Privacy** - All data stored locally, no tracking

---

## Conclusion

**The V4 data model should prioritize:**

1. ✅ **Frequency rankings from OpenSubtitles** - Immediately actionable, open data
2. ✅ **CEFR level estimates** - Based on frequency, aligns with industry
3. ✅ **Unified word IDs** - Enable cross-referencing between modes
4. ✅ **Part of speech tagging** - Essential for proper learning
5. ✅ **Statistics dashboard** - "You know X of top 1000 words"

**Do NOT delay these to V4.1** - The data model is foundational. Retrofitting frequency data later requires migrations and breaks backward compatibility.

**Implementation time estimate:**
- Data pipeline scripts: 4-6 hours
- Vocabulary enhancement: 6-8 hours  
- Service integration: 4-6 hours
- UI components: 4-6 hours
- **Total: 18-26 hours (3-4 coding sessions)**

**ROI:** This investment transforms Espanjapeli from "nice vocabulary game" into "serious language learning tool with measurable progress."

---

**Document Status:** Complete  
**Next Steps:** Review and approve, then begin data pipeline implementation  
**Primary Data Source:** https://github.com/hermitdave/FrequencyWords (CC-BY-SA-4.0)  
**Secondary Sources:** Tatoeba (CC-BY), Wiktionary (CC-BY-SA-3.0)
