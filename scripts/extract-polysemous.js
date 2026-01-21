#!/usr/bin/env node

/**
 * Extract polysemous words (duplicate Spanish words across categories)
 * Outputs: polysemous-words.json with all duplicates for manual editing
 */

const fs = require('fs');
const path = require('path');

// Read words.ts and parse it
const wordsPath = path.join(__dirname, '../svelte/src/lib/data/words.ts');
const wordsContent = fs.readFileSync(wordsPath, 'utf8');

// Extract all word objects from the file
const wordsBySpanish = new Map();
const categoryPattern = /(\w+):\s*{\s*name:\s*'([^']+)',\s*words:\s*\[([^\]]+(?:\][^\]]*\[)*[^\]]*)\]/gs;

let match;
while ((match = categoryPattern.exec(wordsContent)) !== null) {
  const categoryKey = match[1];
  const categoryName = match[2];
  const wordsArrayStr = match[3];
  
  // Parse individual word objects
  const wordPattern = /{\s*spanish:\s*'([^']+)',\s*english:\s*'([^']+)',\s*finnish:\s*'([^']+)'[^}]*}/g;
  let wordMatch;
  
  while ((wordMatch = wordPattern.exec(wordsArrayStr)) !== null) {
    const spanish = wordMatch[1];
    const english = wordMatch[2];
    const finnish = wordMatch[3];
    
    if (!wordsBySpanish.has(spanish)) {
      wordsBySpanish.set(spanish, []);
    }
    
    wordsBySpanish.get(spanish).push({
      spanish,
      english,
      finnish,
      category: categoryKey,
      categoryName
    });
  }
}

// Find duplicates
const polysemousWords = [];
for (const [spanish, entries] of wordsBySpanish.entries()) {
  if (entries.length > 1) {
    polysemousWords.push({
      spanish,
      occurrences: entries.length,
      entries: entries.map(e => ({
        category: e.category,
        categoryName: e.categoryName,
        english: e.english,
        finnish: e.finnish,
        // Placeholder fields for manual editing
        id: `${spanish}#EDIT_ME`,
        senseKey: 'EDIT_ME'
      }))
    });
  }
}

// Sort by Spanish word
polysemousWords.sort((a, b) => a.spanish.localeCompare(b.spanish));

// Output results
const outputPath = path.join(__dirname, '../polysemous-words.json');
fs.writeFileSync(outputPath, JSON.stringify(polysemousWords, null, 2), 'utf8');

console.log(`Found ${polysemousWords.length} polysemous words`);
console.log(`Output written to: ${outputPath}`);
console.log('\nPolysemous words found:');
polysemousWords.forEach(pw => {
  console.log(`  ${pw.spanish} (${pw.occurrences} occurrences)`);
  pw.entries.forEach(e => {
    console.log(`    - ${e.category}: ${e.english} / ${e.finnish}`);
  });
});
console.log('\nNext steps:');
console.log('1. Edit polysemous-words.json:');
console.log('   - Replace EDIT_ME in id field with sense (e.g., "tiempo#time", "tiempo#weather")');
console.log('   - Replace EDIT_ME in senseKey field with human-readable sense');
console.log('   - Update english and finnish translations if needed');
console.log('2. Run: node scripts/apply-polysemous.js');
