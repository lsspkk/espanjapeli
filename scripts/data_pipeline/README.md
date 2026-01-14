# Data Pipeline Scripts

Scripts for downloading and processing frequency data for Espanjapeli V4.

## Overview

These scripts download word frequency data from open sources and convert it to optimized JSON files for the Svelte frontend.

## Data Source

- **Source**: OpenSubtitles 2018 via [FrequencyWords](https://github.com/hermitdave/FrequencyWords)
- **License**: CC-BY-SA-4.0
- **Coverage**: Top 50,000 most frequent words in Spanish and Finnish

## Why Filter to 5000 Words?

| Word Range | CEFR Level | Coverage |
|------------|------------|----------|
| 1-500 | A1 | ~80% of spoken Spanish |
| 501-1500 | A2 | ~90% |
| 1501-3000 | B1 | ~95% |
| 3001-5000 | B2 | ~97% |
| 5001+ | C1/C2 | Rare words |

Top 5000 words cover 97% of everyday Spanish, which is sufficient for A1-B2 learners. Keeping only these words reduces file size from 10MB to ~1MB.

## Scripts

### download_frequency.py

Downloads raw frequency data (50k words) from GitHub and saves to `scripts/data/`.

```bash
python download_frequency.py
```

### filter_frequency.py

Filters the raw data to create tiered JSON files for the frontend.

```bash
python filter_frequency.py
```

Outputs:
- `svelte/static/data/frequency-spanish-top1000.json` (~200KB)
- `svelte/static/data/frequency-spanish-top5000.json` (~1MB)
- `svelte/static/data/frequency-finnish-top5000.json` (~1MB)

### measure_data_size.py

Reports file sizes (raw and gzipped) for all frequency files.

```bash
python measure_data_size.py
```

## Output Format

```json
{
  "version": "1.0.0",
  "source": "OpenSubtitles 2018 via FrequencyWords",
  "license": "CC-BY-SA-4.0",
  "language": "spanish",
  "range": "1-5000",
  "wordCount": 5000,
  "words": {
    "de": {
      "rank": 1,
      "count": 14459520,
      "cefr": "A1",
      "isTop100": true,
      "isTop500": true,
      "isTop1000": true,
      "isTop3000": true,
      "isTop5000": true
    }
  }
}
```

## CEFR Level Estimation

CEFR levels are estimated based on frequency rank:

- Rank 1-500: **A1**
- Rank 501-1500: **A2**
- Rank 1501-3000: **B1**
- Rank 3001-5000: **B2**
- Rank 5001-8000: C1
- Rank 8001+: C2

## Running Tests

```bash
pytest scripts/data_pipeline/ -v
```

## Compression

With gzip enabled on the web server:
- 1MB raw → ~60KB over wire (94% compression)
- No client-side changes needed
