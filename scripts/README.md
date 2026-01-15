# Scripts Directory

This directory contains Python scripts for data generation, validation, and maintenance of the Espanjapeli language learning application.

## Table of Contents

- [Data Validation Scripts](#data-validation-scripts)
- [Data Generation Scripts](#data-generation-scripts)
- [Data Fixing Scripts](#data-fixing-scripts)
- [Testing Scripts](#testing-scripts)
- [Translation Scripts](#translation-scripts)
- [SVG Generation Scripts](#svg-generation-scripts)
- [Data Pipeline](#data-pipeline)
- [Usage Examples](#usage-examples)

---

## Data Validation Scripts

These scripts validate the V4 data model and ensure data integrity across the application.

### `validate_all_data.sh`
**Purpose:** Run all validation scripts in sequence  
**Usage:**
```bash
./scripts/validate_all_data.sh
```
**Output:** Console results + reports in `reports/` directory

### `test_story_data_integrity.py`
**Purpose:** Comprehensive story data validation  
**Validates:**
- Required fields (id, title, level, category, dialogue, vocabulary, questions)
- CEFR level values (A1, A2, B1, B2)
- Manifest-to-file synchronization
- Word counts, vocabulary counts, question counts
- Dialogue structure (speaker, spanish, finnish)
- Question structure (4 options, valid correctIndex)
- No duplicate vocabulary within stories
- V3 legacy field detection

**Usage:**
```bash
python scripts/test_story_data_integrity.py
```
**Output:** `reports/story-validation-results.txt`

### `validate_manifest.py`
**Purpose:** Validate story manifest structure and synchronization  
**Validates:**
- Manifest structure (version, lastUpdated, stories)
- All manifest entries have corresponding story files
- All story files have manifest entries
- Metadata matches between manifest and files
- Stories are in correct level directories (a1/, a2/, b1/)
- No orphaned story files

**Usage:**
```bash
python scripts/validate_manifest.py
```
**Output:** `reports/manifest-validation-results.txt`

### `validate_frequency_data.py`
**Purpose:** Validate Spanish frequency data structure  
**Validates:**
- Metadata fields (version, source, license, etc.)
- Word count matches declared wordCount (5000)
- Rank sequence is continuous (1-5000)
- CEFR levels are valid (A1-C2)
- isTop* flags correctly set (isTop100, isTop500, etc.)
- No duplicate ranks
- Count field is positive integer
- Counts generally decrease with rank

**Usage:**
```bash
python scripts/validate_frequency_data.py
```
**Output:** `reports/frequency-validation-results.txt`

### `validate_vocabulary_database.py`
**Purpose:** Validate words.ts TypeScript vocabulary database  
**Validates:**
- All categories have name and words
- All words have spanish, english, finnish fields
- No empty strings
- No duplicate words within categories
- Learning tips format (if present)
- Cross-reference with frequency data
- Top-N frequency coverage
- Translation consistency

**Usage:**
```bash
python scripts/validate_vocabulary_database.py
```
**Output:** `reports/vocabulary-validation-results.txt`

### `validate_story_vocabulary_crossref.py`
**Purpose:** Cross-reference story vocabulary with dialogue and main database  
**Validates:**
- Story vocabulary words appear in dialogue
- Vocabulary translations are consistent
- Vocabulary links to main word database

**Usage:**
```bash
python scripts/validate_story_vocabulary_crossref.py
```
**Output:** `reports/story-vocabulary-crossref-results.txt`

### `generate_data_consistency_report.py`
**Purpose:** Generate comprehensive data consistency report  
**Aggregates:** All validation results into single markdown report  
**Usage:**
```bash
python scripts/generate_data_consistency_report.py
```
**Output:** `reports/v4-data-consistency-report.md`

---

## Data Generation Scripts

### `generate_stories.py`
**Purpose:** Generate new story content using OpenAI API  
**Features:**
- CEFR-aligned difficulty levels
- Spanish dialogues with Finnish translations
- Comprehension questions
- Vocabulary lists

**Usage:**
```bash
python scripts/generate_stories.py --level A1 --count 5
```

### `add_story_metadata.py`
**Purpose:** Add metadata to existing stories  
**Adds:**
- CEFR levels
- Word counts
- Estimated reading time
- Vocabulary enrichment

**Usage:**
```bash
python scripts/add_story_metadata.py
```

### `enrich_story_vocabulary.py`
**Purpose:** Enhance story vocabulary with linguistic metadata  
**Adds:**
- Part of speech
- Gender (for nouns)
- Frequency rank
- CEFR level
- Example sentences

**Usage:**
```bash
python scripts/enrich_story_vocabulary.py
```

### `regenerate_manifest.py`
**Purpose:** Regenerate manifest.json from story files  
**Features:**
- Scans all level directories (a1/, a2/, b1/, b2/)
- Extracts metadata from each story file
- Calculates word counts, vocabulary counts, question counts
- Updates version and timestamp

**Usage:**
```bash
python scripts/regenerate_manifest.py
```
**Output:** `svelte/static/stories/manifest.json`

---

## Data Fixing Scripts

### `fix_v4_data_issues.py`
**Purpose:** Fix common data issues found by validation scripts  
**Fixes:**
- Remove legacy 'difficulty' field
- Update titles to Finnish
- Fix vocabulary/question counts in manifest
- Standardize category names
- Fix question structure (ensure 4 options)

**Usage:**
```bash
python scripts/fix_v4_data_issues.py
```
**Output:** Updates story files and manifest in place

### `fix_missing_level_fields.py`
**Purpose:** Add missing 'level' field to story files  
**Usage:**
```bash
python scripts/fix_missing_level_fields.py
```

---

## Testing Scripts

### `test_story_structure.py`
**Purpose:** Test story JSON structure  
**Usage:**
```bash
pytest scripts/test_story_structure.py
```

### `test_generate_stories.py`
**Purpose:** Test story generation pipeline  
**Usage:**
```bash
pytest scripts/test_generate_stories.py
```

### `test_generate_vocabulary_index.py`
**Purpose:** Test vocabulary index generation  
**Usage:**
```bash
pytest scripts/test_generate_vocabulary_index.py
```

### `test_migrate_stories.py`
**Purpose:** Test story migration from V3 to V4  
**Usage:**
```bash
pytest scripts/test_migrate_stories.py
```

### `test_three_hints.py`
**Purpose:** Test learning hints generation  
**Usage:**
```bash
pytest scripts/test_three_hints.py
```

### `test_one_word.py`
**Purpose:** Test single word processing  
**Usage:**
```bash
pytest scripts/test_one_word.py
```

### `measure_test_performance.py`
**Purpose:** Measure test suite performance  
**Usage:**
```bash
python scripts/measure_test_performance.py
```
**Output:** `reports/test-performance-baseline.json`

---

## Translation Scripts

### `generate_translations.py`
**Purpose:** Generate Finnish translations for vocabulary  
**Uses:** Azure Translator API or OpenAI API  
**Usage:**
```bash
python scripts/generate_translations.py
```

### `translate_stories.py`
**Purpose:** Translate story dialogues and questions  
**Usage:**
```bash
python scripts/translate_stories.py --story-id <id>
```

### `update_translations.py`
**Purpose:** Update existing translations  
**Usage:**
```bash
python scripts/update_translations.py
```

### `update_manifest_translations.py`
**Purpose:** Update manifest with Finnish translations  
**Usage:**
```bash
python scripts/update_manifest_translations.py
```

### `simple_translate.py`
**Purpose:** Simple translation utility  
**Usage:**
```bash
python scripts/simple_translate.py "Hola mundo"
```

### `test_translation.py`
**Purpose:** Test translation functionality  
**Usage:**
```bash
pytest scripts/test_translation.py
```

### `test_azure_translation.py`
**Purpose:** Test Azure Translator API  
**Usage:**
```bash
python scripts/test_azure_translation.py
```

---

## SVG Generation Scripts

### `generate_missing_svgs.py`
**Purpose:** Generate SVG illustrations for vocabulary words  
**Usage:**
```bash
python scripts/generate_missing_svgs.py
```
**Output:** `svelte/static/svg/`

### `generate_svg_preview.py`
**Purpose:** Preview generated SVG files  
**Usage:**
```bash
python scripts/generate_svg_preview.py
```

### `generate_peppa_images.py`
**Purpose:** Generate Peppa Pig character images for kids games  
**Usage:**
```bash
python scripts/generate_peppa_images.py
```
**Output:** `svelte/static/peppa_advanced_spanish_images/`

### `svg_fixer.py`
**Purpose:** Fix invalid SVG markup  
**Usage:**
```bash
python scripts/svg_fixer.py
```

---

## Data Pipeline

Scripts in the `data_pipeline/` subdirectory handle frequency data processing.

### `download_frequency.py`
**Purpose:** Download Spanish frequency data from OpenSubtitles  
**Output:** Raw frequency data

### `process_frequency.py`
**Purpose:** Process raw frequency data into application format  
**Output:** `svelte/static/data/frequency-spanish-top5000.json`

### `measure_data_size.py`
**Purpose:** Validate bundle sizes for performance  
**Usage:**
```bash
python scripts/data_pipeline/measure_data_size.py
```

---

## Usage Examples

### Complete Data Validation Workflow

```bash
# Run all validations
./scripts/validate_all_data.sh

# Check reports
ls -l reports/

# If issues found, fix them
python scripts/fix_v4_data_issues.py

# Re-run validations
./scripts/validate_all_data.sh
```

### Adding New Stories

```bash
# 1. Generate stories
python scripts/generate_stories.py --level A2 --count 3

# 2. Enrich vocabulary
python scripts/enrich_story_vocabulary.py

# 3. Regenerate manifest
python scripts/regenerate_manifest.py

# 4. Validate
./scripts/validate_all_data.sh
```

### Updating Vocabulary

```bash
# 1. Edit svelte/src/lib/data/words.ts manually

# 2. Generate translations if needed
python scripts/update_translations.py

# 3. Generate SVGs for new words
python scripts/generate_missing_svgs.py

# 4. Validate
python scripts/validate_vocabulary_database.py
```

### Fixing Data Issues

```bash
# 1. Run validation to identify issues
./scripts/validate_all_data.sh

# 2. Review reports
cat reports/story-validation-results.txt
cat reports/manifest-validation-results.txt

# 3. Fix issues automatically
python scripts/fix_v4_data_issues.py

# 4. Verify fixes
./scripts/validate_all_data.sh
```

---

## Environment Setup

Most scripts require Python 3.8+ and the following packages:

```bash
# Install dependencies
pip install -r requirements.txt

# For translation scripts, set environment variables:
export AZURE_TRANSLATOR_KEY="your-key"
export AZURE_TRANSLATOR_REGION="your-region"
export OPENAI_API_KEY="your-key"
```

---

## Best Practices

1. **Always validate after changes:** Run `validate_all_data.sh` after modifying data files
2. **Use version control:** Commit data changes separately from code changes
3. **Review generated content:** AI-generated stories and translations need manual review
4. **Backup before fixing:** The fix scripts modify files in place
5. **Check reports:** Validation reports in `reports/` provide detailed diagnostics

---

## Troubleshooting

### Validation Failures

If validation scripts fail:
1. Check the detailed report in `reports/` directory
2. Review the specific error messages
3. Use `fix_v4_data_issues.py` for common issues
4. Manually fix complex issues in story files

### Missing Dependencies

```bash
# Install pytest
pip install pytest

# Install other dependencies
pip install -r requirements.txt
```

### Permission Errors

```bash
# Make scripts executable
chmod +x scripts/*.sh
chmod +x scripts/*.py
```

---

## Contributing

When adding new scripts:
1. Follow the naming convention: `verb_noun.py` (e.g., `validate_manifest.py`)
2. Include docstring with purpose, usage, and output
3. Add pytest tests if applicable
4. Update this README
5. Generate validation reports in `reports/` directory

---

**Last Updated:** January 15, 2026  
**Version:** 4.2.0
