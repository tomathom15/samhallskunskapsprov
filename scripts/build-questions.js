#!/usr/bin/env node
'use strict';
/**
 * Build script: concatenate per-category question source files into a single
 * questions/<deck>.json that the browser fetches.
 *
 * Usage:
 *   node scripts/build-questions.js          # builds questions/sweden.json
 *   node scripts/build-questions.js denmark  # builds questions/denmark.json
 *
 * Source files must be in questions/<deck>/ and named NN-*.json.
 * Each source file must have the shape:
 *   { "category": "...", "questions": [ { ...question without category... } ] }
 *
 * The build script injects the file-level `category` into every question
 * so contributors only write it once per file.
 */

const fs   = require('fs');
const path = require('path');

const DECK    = process.argv[2] || 'sweden';
const SRC_DIR = path.join(__dirname, '..', 'questions', DECK);
const OUT     = path.join(__dirname, '..', 'questions', `${DECK}.json`);

if (!fs.existsSync(SRC_DIR)) {
  console.error(`Error: source directory not found: ${SRC_DIR}`);
  process.exit(1);
}

const questions = [];

const files = fs.readdirSync(SRC_DIR)
  .filter(f => f.endsWith('.json'))
  .sort();

if (files.length === 0) {
  console.error(`Error: no .json files found in ${SRC_DIR}`);
  process.exit(1);
}

for (const file of files) {
  const filePath = path.join(SRC_DIR, file);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Error parsing ${file}: ${e.message}`);
    process.exit(1);
  }
  const { category, questions: qs } = parsed;
  if (!category || !Array.isArray(qs)) {
    console.error(`Error: ${file} must have "category" (string) and "questions" (array)`);
    process.exit(1);
  }
  qs.forEach(q => questions.push({ ...q, category }));
  console.log(`  ${file}: ${qs.length} questions (${category})`);
}

// Duplicate ID check
const ids   = questions.map(q => q.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) {
  console.error('Error: duplicate question IDs:', [...new Set(dupes)].join(', '));
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify({ questions }, null, 2));
console.log(`\nBuilt ${OUT} — ${questions.length} questions`);
