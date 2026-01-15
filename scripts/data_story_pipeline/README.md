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
