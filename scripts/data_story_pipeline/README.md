# Data Story Pipeline

Pipeline for acquiring and processing Spanish learning content from open-licensed sources.

## Data Sources

### Tatoeba (CC-BY 2.0 FR)
- URL: https://tatoeba.org
- Content: Sentence pairs with translations
- Downloads: https://downloads.tatoeba.org/exports/

## Scripts

### 1. download_tatoeba.py
Downloads sentences from Tatoeba that have translations in all three languages:
- Spanish (spa)
- Finnish (fin)  
- English (eng)

Output: `data/tatoeba_spa_fin_eng.json` and `.csv`

## Usage

```bash
cd scripts/data_story_pipeline
python download_tatoeba.py
```

## Output Format

The downloaded data contains sentence triples:
```json
{
  "spa_id": "123",
  "fin_id": "456", 
  "eng_id": "789",
  "spa": "Spanish sentence",
  "fin": "Finnish translation",
  "eng": "English translation"
}
```

## Next Steps

After downloading raw sentences, additional scripts can:
- Filter by topic/theme
- Group into dialogue-like sequences
- Transform to story format


  Final dataset:
  • 8,238 unique trilingual sentence triples (down from
    11,760 with duplicates)
  • Each Spanish sentence appears exactly once
  • Clean CSV and JSON output files

  Length distribution:
  • 1-3 words: 1,757 sentences (21%)
  • 4-6 words: 4,247 sentences (52%)
  • 7-10 words: 1,852 sentences (22%)
  • 11+ words: 382 sentences (5%)
  • Average: 5.5 words per sentence