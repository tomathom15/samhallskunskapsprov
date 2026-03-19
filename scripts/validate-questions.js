#!/usr/bin/env node
'use strict';
/**
 * Validate script: checks that questions/<deck>.json (the built output)
 * conforms to the expected schema.
 *
 * Usage:
 *   node scripts/validate-questions.js          # validates questions/sweden.json
 *   node scripts/validate-questions.js denmark  # validates questions/denmark.json
 *
 * Exits with code 0 on success, code 1 if any errors are found.
 */

const fs   = require('fs');
const path = require('path');

const DECK     = process.argv[2] || 'sweden';
const SRC      = path.join(__dirname, '..', 'questions', `${DECK}.json`);
const VALID_DIFFICULTIES = new Set(['beginner', 'intermediate', 'expert']);

if (!fs.existsSync(SRC)) {
  console.error(`Error: ${SRC} not found — run "npm run build:questions" first`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
} catch (e) {
  console.error(`Error parsing ${SRC}: ${e.message}`);
  process.exit(1);
}

const errors = [];
const { questions } = data;

if (!Array.isArray(questions) || questions.length === 0) {
  errors.push('Root "questions" array is missing or empty');
}

const seenIds = new Set();

(questions || []).forEach((q, idx) => {
  const ref = `Question[${idx}] (id=${q.id ?? 'MISSING'})`;

  // Required string fields
  for (const field of ['question', 'explanation', 'category']) {
    if (typeof q[field] !== 'string' || q[field].trim() === '') {
      errors.push(`${ref}: "${field}" must be a non-empty string`);
    }
  }

  // id must be a positive integer
  if (typeof q.id !== 'number' || !Number.isInteger(q.id) || q.id < 1) {
    errors.push(`${ref}: "id" must be a positive integer`);
  } else if (seenIds.has(q.id)) {
    errors.push(`${ref}: duplicate id ${q.id}`);
  } else {
    seenIds.add(q.id);
  }

  // options must be an array of exactly 4 non-empty strings
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push(`${ref}: "options" must be an array of exactly 4 items`);
  } else {
    q.options.forEach((opt, i) => {
      if (typeof opt !== 'string' || opt.trim() === '') {
        errors.push(`${ref}: options[${i}] must be a non-empty string`);
      }
    });
  }

  // correct_index must be 0–3
  if (typeof q.correct_index !== 'number' || q.correct_index < 0 || q.correct_index > 3) {
    errors.push(`${ref}: "correct_index" must be an integer in 0–3`);
  }

  // difficulty must be one of the valid values
  if (!VALID_DIFFICULTIES.has(q.difficulty)) {
    errors.push(`${ref}: "difficulty" must be beginner, intermediate, or expert (got "${q.difficulty}")`);
  }

  // distractor_notes: if present, must be an array of exactly 4 items (string or null)
  if (q.distractor_notes !== undefined) {
    if (!Array.isArray(q.distractor_notes) || q.distractor_notes.length !== 4) {
      errors.push(`${ref}: "distractor_notes" must be an array of exactly 4 items`);
    } else {
      q.distractor_notes.forEach((note, i) => {
        if (note !== null && typeof note !== 'string') {
          errors.push(`${ref}: distractor_notes[${i}] must be a string or null`);
        }
      });
    }
  }

  // options_sv: if present, must be an array of exactly 4 non-empty strings
  if (q.options_sv !== undefined) {
    if (!Array.isArray(q.options_sv) || q.options_sv.length !== 4) {
      errors.push(`${ref}: "options_sv" must be an array of exactly 4 items`);
    } else {
      q.options_sv.forEach((opt, i) => {
        if (typeof opt !== 'string' || opt.trim() === '') {
          errors.push(`${ref}: options_sv[${i}] must be a non-empty string`);
        }
      });
    }
  }
});

if (errors.length > 0) {
  console.error(`\nValidation FAILED — ${errors.length} error(s):\n`);
  errors.forEach(e => console.error('  ✗', e));
  process.exit(1);
} else {
  console.log(`Validation passed — ${questions.length} questions in ${SRC}`);
}
