# V5 Migration Edge Cases and Notes

## Overview

This document describes edge cases and limitations in the V4→V5 data migration for the wordKnowledge store.

## Migration Process

The migration runs automatically when the application loads and detects V4 data in localStorage. It converts the old data structure (where keys are Spanish words) to the new V5 structure (where keys are word IDs for polysemous words, or Spanish words for simple words).

## Edge Cases

### 1. Polysemous Words - Data Loss (Expected)

**Issue**: Words with multiple meanings (polysemous words) cannot be migrated automatically.

**Reason**: In V4, the key was just the Spanish word (e.g., "tiempo"). In V5, polysemous words have separate entries with IDs (e.g., "tiempo#time" and "tiempo#weather"). The migration cannot determine which meaning the user was practicing in V4.

**Behavior**:
- Migration skips polysemous words entirely
- Console warning: `⚠️ Migration: Word "tiempo" has multiple meanings (polysemous), skipping. User will re-learn these words.`
- User's practice history for that word is lost

**Impact**: Users will need to re-practice polysemous words from scratch in V5.

**Examples of affected words**:
- tiempo (time/weather)
- banco (bank/bench)
- copa (cup/trophy)
- planta (plant/floor)
- carta (letter/menu)

**Mitigation**: This is acceptable because:
- Polysemous words are a small fraction of vocabulary (~5-10%)
- The ambiguity makes migration unreliable anyway
- Users benefit from re-learning with proper sense distinction

### 2. Removed Words - Data Loss (Expected)

**Issue**: Words that existed in V4 but were removed from the vocabulary database cannot be migrated.

**Reason**: The migration validates each word against the current vocabulary. If a word no longer exists, there's no target to migrate to.

**Behavior**:
- Migration skips removed words
- Console warning: `⚠️ Migration: Word "palabraremovida" not found in vocabulary database, skipping`
- User's practice history for that word is lost

**Impact**: Minimal, as removed words are typically:
- Typos or errors that were corrected
- Duplicates that were consolidated
- Words moved to different categories

**Mitigation**: This is acceptable because:
- Word removals are rare
- Removed words were likely problematic in V4
- No way to preserve data for non-existent vocabulary

### 3. Empty Data - Handled Correctly

**Issue**: None - this is a success case.

**Behavior**:
- Migration creates valid V5 structure with empty words object
- No warnings
- Metadata is initialized with default values

**Impact**: None - works as expected.

### 4. Large Datasets (100+ words) - Performance

**Issue**: Migration of large datasets may take a few seconds.

**Behavior**:
- Migration processes all words sequentially
- Console shows progress
- May cause brief UI freeze on app load

**Impact**: Minimal - migration only runs once per user.

**Mitigation**: 
- Migration is fast enough for typical datasets (<1000 words)
- Users only experience delay once
- Future optimization possible if needed

### 5. Idempotency - Safe Re-runs

**Issue**: None - this is a success case.

**Behavior**:
- Migration checks version number first
- If data is already V5, migration is skipped
- No data modification occurs

**Impact**: None - safe to reload app multiple times.

### 6. Metadata Preservation - Handled Correctly

**Issue**: None - this is a success case.

**Behavior**:
- All metadata fields are preserved:
  - createdAt
  - totalGamesPlayed
  - basicGamesPlayed
  - kidsGamesPlayed
- updatedAt is set to migration time
- Game history is fully preserved

**Impact**: None - user statistics remain intact.

### 7. All Word Knowledge Fields Preserved

**Issue**: None - this is a success case.

**Behavior**:
- All practice data is preserved for migrated words:
  - score
  - practiceCount
  - firstTryCount, secondTryCount, thirdTryCount
  - failedCount
  - lastPracticed, firstPracticed
  - storiesEncountered (if present)
  - storyEncounterCount (if present)
- Data preserved for both directions (spanish_to_finnish, finnish_to_spanish)
- Data preserved for both modes (basic, kids)

**Impact**: None - full history maintained.

## Summary of Data Loss

**Only two scenarios cause data loss:**

1. **Polysemous words** - Cannot be migrated due to ambiguity
2. **Removed words** - Cannot be migrated because vocabulary no longer exists

Both scenarios are:
- Rare (affects <10% of typical user data)
- Unavoidable (no reliable way to migrate)
- Acceptable (users re-learn with better data model)

**All other data is preserved perfectly.**

## User Communication

Users should be informed that:
- Migration happens automatically
- Most data is preserved
- Some words with multiple meanings may need to be re-learned
- This is a one-time process

## Testing Results

All test fixtures pass:
- ✅ Empty data
- ✅ 10 words
- ✅ 100+ words
- ✅ Polysemous words (correctly skipped)
- ✅ Removed words (correctly skipped)
- ✅ All fields preserved
- ✅ Idempotent (safe re-runs)

See `svelte/src/lib/stores/wordKnowledge.migration.test.ts` for detailed test coverage.

## Browser Testing

Manual browser testing confirms:
- Migration runs smoothly in real environment
- Console warnings are clear and helpful
- Games work correctly with migrated data
- No performance issues with typical datasets

See `docs/v5-migration-testing-guide.md` for browser testing procedures.

## Recommendations

1. **No action needed** - Migration handles all cases appropriately
2. **Monitor console warnings** - Track how many users have polysemous/removed words
3. **Consider user notification** - Optional: Show one-time message explaining migration
4. **Future enhancement** - Could add migration report to UI showing what was migrated/skipped

## Technical Details

**Migration function**: `migrateV4toV5()` in `svelte/src/lib/stores/wordKnowledge.ts`

**Algorithm**:
1. Build lookup map: Spanish word → Word[] from current vocabulary
2. For each V4 word entry:
   - Look up word in vocabulary
   - If not found: skip (removed word)
   - If multiple matches: skip (polysemous word)
   - If single match: migrate to new key (word.id or word.spanish)
3. Preserve metadata and game history
4. Return V5 data structure

**Key insight**: Migration is conservative - it only migrates data it can reliably map to V5 structure.
