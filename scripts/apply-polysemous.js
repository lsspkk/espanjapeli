#!/usr/bin/env node

/**
 * Apply polysemous word IDs and senseKeys to words.ts
 * Reads edited polysemous-words.json and updates words.ts
 */

const fs = require('fs');
const path = require('path');

// Read polysemous words JSON
const polysemousPath = path.join(__dirname, '../polysemous-words.json');
const polysemousWords = JSON.parse(fs.readFileSync(polysemousPath, 'utf8'));

// Build lookup map: category -> spanish -> entry
const lookupMap = new Map();
for (const pw of polysemousWords) {
  for (const entry of pw.entries) {
    const key = `${entry.category}:${pw.spanish}`;
    lookupMap.set(key, entry);
  }
}

// Read words.ts
const wordsPath = path.join(__dirname, '../svelte/src/lib/data/words.ts');
let wordsContent = fs.readFileSync(wordsPath, 'utf8');

// Track changes
let changesCount = 0;

// Process each category
const categoryPattern = /(\w+):\s*{\s*name:\s*'([^']+)',\s*words:\s*\[/g;
let categoryMatch;
const categories = [];

while ((categoryMatch = categoryPattern.exec(wordsContent)) !== null) {
  categories.push({
    key: categoryMatch[1],
    startIndex: categoryMatch.index
  });
}

// Process categories in reverse order to maintain string indices
for (let i = categories.length - 1; i >= 0; i--) {
  const category = categories[i];
  const categoryKey = category.key;
  
  // Find the end of this category's words array
  const startIndex = category.startIndex;
  const nextCategoryIndex = i < categories.length - 1 ? categories[i + 1].startIndex : wordsContent.length;
  const categorySection = wordsContent.substring(startIndex, nextCategoryIndex);
  
  // Find all word objects in this category
  const wordPattern = /{\s*spanish:\s*'([^']+)',\s*english:\s*'([^']+)',\s*finnish:\s*'([^']+)'([^}]*)}/g;
  let wordMatch;
  const replacements = [];
  
  while ((wordMatch = wordPattern.exec(categorySection)) !== null) {
    const spanish = wordMatch[1];
    const english = wordMatch[2];
    const finnish = wordMatch[3];
    const rest = wordMatch[4];
    const fullMatch = wordMatch[0];
    const matchIndex = startIndex + wordMatch.index;
    
    // Check if this word needs polysemous ID
    const lookupKey = `${categoryKey}:${spanish}`;
    const polysemousEntry = lookupMap.get(lookupKey);
    
    if (polysemousEntry) {
      // Check if it already has id field
      if (!rest.includes('id:')) {
        // Build new word object with id and senseKey
        const newWordObj = `{ spanish: '${spanish}', english: '${english}', finnish: '${finnish}', id: '${polysemousEntry.id}', senseKey: '${polysemousEntry.senseKey}'${rest} }`;
        
        replacements.push({
          start: matchIndex,
          end: matchIndex + fullMatch.length,
          replacement: newWordObj
        });
        
        changesCount++;
        console.log(`  ${categoryKey}: ${spanish} -> id: ${polysemousEntry.id}, senseKey: ${polysemousEntry.senseKey}`);
      }
    }
  }
  
  // Apply replacements in reverse order
  for (let j = replacements.length - 1; j >= 0; j--) {
    const r = replacements[j];
    wordsContent = wordsContent.substring(0, r.start) + r.replacement + wordsContent.substring(r.end);
  }
}

// Write updated words.ts
fs.writeFileSync(wordsPath, wordsContent, 'utf8');

console.log(`\nApplied ${changesCount} polysemous word updates to words.ts`);
console.log('Done!');
