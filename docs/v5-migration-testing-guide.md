# V4→V5 Migration Browser Testing Guide

## Overview

This guide describes how to manually test the V4→V5 migration in a real browser environment.

## Test Tool

A dedicated test page has been created: `svelte/static/migration-test.html`

Access it at: `http://localhost:5173/migration-test.html` (when dev server is running)

## Testing Procedure

### 1. Start Development Server

```bash
cd svelte
npm run dev
```

### 2. Open Test Tool

Navigate to: `http://localhost:5173/migration-test.html`

### 3. Test Each Fixture

For each test fixture, follow these steps:

#### a) Inject V4 Data
- Click one of the fixture buttons (Empty Data, 10 Words, etc.)
- Verify success message appears

#### b) Open Browser Console
- Press F12 to open DevTools
- Go to Console tab
- Keep it open to see migration warnings

#### c) Trigger Migration
- Click "Reload App (Go to Home)" button
- This navigates to the main app and triggers migration

#### d) Verify Migration
- Check console for migration messages:
  - Should see warnings for polysemous words (if applicable)
  - Should see warnings for removed words (if applicable)
- Navigate back to test tool: `http://localhost:5173/migration-test.html`
- Click "Refresh Display" to see migrated data
- Verify:
  - Version is now 5
  - Word count is correct
  - Word keys are correct (polysemous words should be skipped)
  - Metadata is preserved

#### e) Test Game Functionality
- Navigate to different game modes
- Verify word knowledge tracking works
- Check that games can access and update the migrated data

#### f) Reset for Next Test
- Return to test tool
- Click "Clear All Data"
- Proceed to next fixture

## Test Fixtures

### 1. Empty Data
- **Purpose**: Verify migration handles empty V4 data
- **Expected**: Clean V5 structure with no words
- **Console warnings**: None

### 2. 10 Words
- **Purpose**: Verify basic migration with small dataset
- **Expected**: Words like 'hola', 'adios' migrate correctly
- **Console warnings**: May warn about words not in current vocabulary (casa, perro, etc.)

### 3. 100+ Words
- **Purpose**: Performance test with large dataset
- **Expected**: Migration completes without hanging
- **Console warnings**: Many warnings for words not in mock vocabulary

### 4. Polysemous Words
- **Purpose**: Verify polysemous words are skipped
- **Expected**: 'tiempo' is NOT migrated, 'hola' is migrated
- **Console warnings**: Should see "polysemous word" warnings for 'tiempo'

### 5. Removed Words
- **Purpose**: Verify removed words are skipped
- **Expected**: 'palabraremovida' is NOT migrated, 'hola' is migrated
- **Console warnings**: Should see "not found in vocabulary" warnings

## Custom Testing

Use the "Manual Data Injection" section to test custom scenarios:

1. Paste V4 JSON data into textarea
2. Click "Inject Custom Data"
3. Follow standard testing procedure

## Verification Checklist

After testing all fixtures, verify:

- ✅ Empty data migrates without errors
- ✅ Simple words migrate correctly with all fields preserved
- ✅ Polysemous words are skipped with appropriate warnings
- ✅ Removed words are skipped with appropriate warnings
- ✅ Large datasets migrate without performance issues
- ✅ Metadata (createdAt, totalGamesPlayed, etc.) is preserved
- ✅ Game history is preserved
- ✅ V5 data is not re-migrated (idempotent)
- ✅ Games can read and update migrated data
- ✅ No data loss for valid words

## Expected Console Output

### Successful Migration
```
Migration: V4 → V5
Migration: Processing X words...
Migration: Migrated Y words, skipped Z words
Migration: Complete
```

### Polysemous Word Warning
```
Migration: Skipping polysemous word 'tiempo' - cannot determine which sense was practiced in V4
```

### Removed Word Warning
```
Migration: Word 'palabraremovida' not found in vocabulary, skipping
```

## Troubleshooting

### Migration doesn't trigger
- Clear localStorage completely
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors

### Data looks wrong
- Verify you're looking at the correct localStorage key: `yhdistasanat_word_knowledge`
- Check that version changed from 4 to 5
- Verify word keys match expected format

### Games don't work after migration
- Check browser console for errors
- Verify localStorage data structure is valid V5 format
- Test with fresh V4 data injection

## Notes

- Migration is automatic and happens on app load
- Migration is idempotent (safe to run multiple times)
- Original V4 data is overwritten (no backup in localStorage)
- Polysemous words cannot be migrated due to ambiguity
- Users will need to re-practice polysemous words in V5
