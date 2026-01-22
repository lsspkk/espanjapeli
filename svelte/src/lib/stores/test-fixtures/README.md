# V4 Migration Test Fixtures

This directory contains test fixtures for V4→V5 migration testing.

## Fixtures

### v4-empty.json
Empty V4 data with no words. Tests that migration handles empty state correctly.

### v4-10-words.json
V4 data with 10 common Spanish words. Includes:
- Words with both Spanish→Finnish and Finnish→Spanish practice
- Words with only one direction practiced
- Words with both basic and kids mode data
- Words with story encounter data
- Sample game history

### v4-100-words.json
V4 data with 100+ words. Generated programmatically to test migration performance with larger datasets. Includes:
- Mix of basic and kids mode data
- Various practice counts and scores
- Realistic date ranges

### v4-polysemous.json
V4 data containing polysemous words that should be skipped during migration:
- `tiempo` (time/weather) - has multiple meanings in V5
- `banco` (bank/bench) - polysemous word
- `copa` (cup/trophy) - polysemous word
- `planta` (plant/floor) - polysemous word
- `carta` (letter/menu) - polysemous word
- Also includes non-polysemous words (hola, adios) that should migrate successfully

### v4-removed-words.json
V4 data containing words that no longer exist in the vocabulary database:
- `palabraremovida` - removed word
- `antiguapalabra` - old word no longer in vocabulary
- `vocabularioviejo` - deprecated word
- Also includes current words (hola, adios, casa) that should migrate successfully

## Usage

These fixtures are used in `wordKnowledge.migration.test.ts` to verify that:
1. Empty data migrates without errors
2. Small datasets migrate correctly with all data preserved
3. Large datasets (100+ words) migrate efficiently
4. Polysemous words are detected and skipped with appropriate warnings
5. Removed words are detected and skipped with appropriate warnings
6. Valid words migrate successfully even when mixed with problematic words

## Generating New Fixtures

To regenerate the 100+ words fixture:

```bash
cd svelte/src/lib/stores/test-fixtures
node generate-large-fixture.js > v4-100-words.json
```
