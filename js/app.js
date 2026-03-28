'use strict';

/* ============================================================
   Configuration
   ============================================================ */
const CONFIG = {
  PASS_THRESHOLD: 0.80,
  KEY_RATIO:      0.40,
  TEST_LENGTHS:   [10, 20, 30, 45],
};

/**
 * IDs of the most fundamental civics questions.
 * ~40% of every test will be drawn from this pool,
 * ensuring core concepts always appear.
 */
const KEY_IDS = new Set([
  // Government & Democracy — core institutions
  1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 14, 17, 18, 86, 87, 88, 90, 91, 93, 94,
  // History — landmark events
  21, 22, 23, 24, 25, 26, 29, 30, 31, 96, 97, 98, 99, 101, 107, 108,
  // Geography — essentials
  36, 37, 38, 42, 111, 114, 118, 119,
  // Society & Welfare — key programmes
  46, 47, 48, 49, 51, 52, 143, 145,
  // Rights & Law — fundamental rights
  55, 56, 57, 58, 60, 62, 153, 160, 164,
  // Culture & Traditions — iconic
  63, 64, 65, 66, 67, 69, 70, 71, 127, 130, 131,
  // Economy — key facts
  73, 74, 75, 166, 176,
  // Values & Society — defining concepts
  79, 80, 81, 82, 83, 85, 183, 184, 187, 191,
  // Environment
  196, 197, 198,
]);

const LETTERS = ['A', 'B', 'C', 'D'];

/* ============================================================
   Application state
   ============================================================ */
let state = {
  allQuestions:   [],   // loaded from questions.json
  questions:      [],   // selected for the current test
  currentIndex:   0,
  selectedOption: null,
  answers:        [],   // [{question, selectedIndex, isCorrect}]
  testLength:     45,
  difficulty:     'all',  // 'all' | 'beginner' | 'intermediate' | 'expert'
  lang:           'en',   // 'en' | 'sv'
  testLanguage:   'en',   // language test was started in — used for summary page
  phase:          'loading', // loading | landing | question | feedback | summary
};

/* ============================================================
   Utilities
   ============================================================ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Capitalise first letter — used to build i18n key names. */
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setHTML(html) {
  const app = document.getElementById('app');
  app.classList.remove('app-fade-in');
  void app.offsetWidth;              // force reflow — makes animation restart
  app.innerHTML = html;
  app.classList.add('app-fade-in');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ============================================================
   Modal helpers
   ============================================================ */
/**
 * Append a modal overlay to #app.
 * html is injected inside .modal-card; bindFn receives the overlay element.
 * Clicking the backdrop dismisses the modal.
 */
function showModal(html, bindFn) {
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-card">${html}</div>`;
  document.getElementById('app').appendChild(overlay);
  bindFn(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) dismissModal(); });
}

function dismissModal() {
  document.getElementById('modal-overlay')?.remove();
}

/** Show the exit modal (✕ Exit button clicked during question/feedback). */
function showExitModal() {
  const hasAnswers = state.answers.length > 0;
  showModal(`
    <h3 class="modal-title">${t('exitModalTitle')}</h3>
    <p class="modal-body">${t('exitModalBody')}</p>
    <div class="modal-actions">
      <button class="btn-modal-secondary" id="btnExitStart">${t('exitModalStart')}</button>
      <button class="btn-modal-primary" id="btnExitCancel">${t('exitModalCancel')}</button>
      ${hasAnswers ? `<button class="btn-modal-secondary" id="btnExitResults">${t('exitModalResults')}</button>` : ''}
    </div>
  `, overlay => {
    overlay.querySelector('#btnExitStart').addEventListener('click', () => {
      dismissModal();
      state.phase = 'landing'; state.currentIndex = 0;
      state.answers = []; state.selectedOption = null; state.questions = [];
      render();
    });
    overlay.querySelector('#btnExitCancel').addEventListener('click', dismissModal);
    if (hasAnswers) {
      overlay.querySelector('#btnExitResults').addEventListener('click', () => {
        dismissModal();
        state.phase = 'summary';
        render();
      });
    }
  });
}

/** Show the lang-switch warning modal (lang toggle clicked during question/feedback). */
function showLangWarningModal() {
  showModal(`
    <h3 class="modal-title">${t('langModalTitle')}</h3>
    <p class="modal-body">${t('langModalBody')}</p>
    <div class="modal-actions">
      <button class="btn-modal-secondary" id="btnLangSwitch">${t('langModalCancel')}</button>
      <button class="btn-modal-primary" id="btnLangCancel">${t('langModalConfirm')}</button>
    </div>
  `, overlay => {
    overlay.querySelector('#btnLangCancel').addEventListener('click', dismissModal);
    overlay.querySelector('#btnLangSwitch').addEventListener('click', () => {
      dismissModal();
      state.lang = state.lang === 'en' ? 'sv' : 'en';
      state.phase = 'landing'; state.currentIndex = 0;
      state.answers = []; state.selectedOption = null; state.questions = [];
      render();
    });
  });
}

/* ============================================================
   Language-aware question content helpers
   Falls back to English silently if SV fields are absent.
   ============================================================ */
function qText(q)        { return (state.lang === 'sv' && q.question_sv)    ? q.question_sv    : q.question; }
function qOptions(q)     { return (state.lang === 'sv' && q.options_sv)     ? q.options_sv     : q.options; }
function qExplanation(q) { return (state.lang === 'sv' && q.explanation_sv) ? q.explanation_sv : q.explanation; }

/** Return question text in the language the test was taken in — used for summary page. */
function qTextOriginal(q)        { return (state.testLanguage === 'sv' && q.question_sv)    ? q.question_sv    : q.question; }
function qOptionsOriginal(q)     { return (state.testLanguage === 'sv' && q.options_sv)     ? q.options_sv     : q.options; }
function qExplanationOriginal(q) { return (state.testLanguage === 'sv' && q.explanation_sv) ? q.explanation_sv : q.explanation; }

/**
 * Show a notification on the summary page when language toggle is clicked.
 * Offers to restart the test in a different language.
 * (C5: Language switch notification)
 */
function showLangSwitchNotification() {
  const otherLang = state.lang === 'en' ? 'sv' : 'en';
  const otherLangName = otherLang === 'en' ? 'English' : 'Svenska';

  // Remove existing notification if present
  const existing = document.querySelector('.lang-notif-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'lang-notif-overlay';
  overlay.innerHTML = `
    <div class="lang-notif">
      <div class="lang-notif-title">${t('langSwitchNotifTitle')}</div>
      <div class="lang-notif-msg">${t('langSwitchNotifMsg')}</div>
      <div class="lang-notif-buttons">
        <button class="lang-notif-btn lang-notif-btn--restart" id="btnRestartInLang">
          ${t('langSwitchNotifBtn')} ${otherLangName}
        </button>
        <button class="lang-notif-btn lang-notif-btn--dismiss" id="btnDismissNotif">
          ${t('langModalCancel')}
        </button>
      </div>
    </div>
  `;

  document.getElementById('app').appendChild(overlay);

  overlay.querySelector('#btnRestartInLang').addEventListener('click', () => {
    state.lang = otherLang;
    state.testLanguage = otherLang;
    state.phase = 'landing';
    state.currentIndex = 0;
    state.answers = [];
    state.selectedOption = null;
    state.questions = [];
    render();
  });

  overlay.querySelector('#btnDismissNotif').addEventListener('click', () => {
    overlay.remove();
  });
}

/* ============================================================
   Question selection
   ============================================================ */
/**
 * Randomly permutes the A/B/C/D order of a question's options.
 * Applies the same permutation to correct_index, distractor_notes,
 * options_sv, and distractor_notes_sv so all positional arrays stay aligned.
 * This makes the raw correct_index in the source file useless for cheating.
 */
function shuffleOptions(q) {
  const cloned  = { ...q };
  const indices = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  cloned.options       = indices.map(i => q.options[i]);
  cloned.correct_index = indices.indexOf(q.correct_index);
  if (q.distractor_notes)    cloned.distractor_notes    = indices.map(i => q.distractor_notes[i]);
  if (q.options_sv)          cloned.options_sv          = indices.map(i => q.options_sv[i]);
  if (q.distractor_notes_sv) cloned.distractor_notes_sv = indices.map(i => q.distractor_notes_sv[i]);
  return cloned;
}

/**
 * Select `total` questions:
 *   - Filtered to state.difficulty (if not 'all')
 *   - ~40% drawn from KEY_IDS pool within that filtered set
 *   - ~60% drawn randomly from the rest
 *   - Total is capped at the available pool size
 */
function selectQuestions(total) {
  const pool = state.difficulty === 'all'
    ? state.allQuestions
    : state.allQuestions.filter(q => q.difficulty === state.difficulty);

  const effectiveTotal = Math.min(total, pool.length);

  const keyPool    = pool.filter(q => KEY_IDS.has(q.id));
  const nonKeyPool = pool.filter(q => !KEY_IDS.has(q.id));

  // KEY_RATIO is a soft target — degrades gracefully if filtered pool is small
  const keyCount    = Math.round(effectiveTotal * CONFIG.KEY_RATIO);
  const selected    = shuffle(keyPool).slice(0, Math.min(keyCount, keyPool.length));
  const remaining   = effectiveTotal - selected.length;
  const selectedIds = new Set(selected.map(q => q.id));
  const extra       = shuffle(nonKeyPool.filter(q => !selectedIds.has(q.id))).slice(0, remaining);

  return shuffle([...selected, ...extra]).map(shuffleOptions);
}

/** Returns available pool size for the current difficulty setting. */
function poolSize() {
  if (state.difficulty === 'all') return state.allQuestions.length;
  return state.allQuestions.filter(q => q.difficulty === state.difficulty).length;
}

/* ============================================================
   Shared HTML fragments
   ============================================================ */
function progressHeaderHTML(questionNum, total) {
  const pct = (questionNum / total) * 100;
  return `
    <button class="btn-exit floating" id="btnExit">${t('exitBtn')}</button>
    <button class="lang-toggle floating" id="btnLangToggle">${t('langToggle')}</button>
    <header class="progress-header">
      <div class="progress-card">
        <div class="progress-title">🇸🇪 ${t('appTitle')}</div>
        <div class="progress-label">${t('questionOf', questionNum, total)}</div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct.toFixed(1)}%"></div></div>
      </div>
    </header>`;
}

/**
 * Bind the language toggle button.
 * warn=true  → shows a confirmation modal (question/feedback phases)
 * warn=false → switches language silently (landing/summary phases)
 */
function bindLangToggle(warn) {
  const btn = document.getElementById('btnLangToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (warn) {
      showLangWarningModal();
    } else {
      state.lang = state.lang === 'en' ? 'sv' : 'en';
      render();
    }
  });
}

/** Bind the exit button (question/feedback progress header). */
function bindExitBtn() {
  const btn = document.getElementById('btnExit');
  if (btn) btn.addEventListener('click', showExitModal);
}

/* ============================================================
   Difficulty helpers
   ============================================================ */
const DIFF_OPTIONS = ['all', 'beginner', 'intermediate', 'expert'];
const DIFF_ICONS   = { all: '📚', beginner: '⭐', intermediate: '⭐⭐', expert: '⭐⭐⭐' };

/** Returns an informational note if the pool is smaller than the requested test length. */
function diffPoolNoteHTML() {
  const size = poolSize();
  if (size >= state.testLength) return '';
  const diffLabel = t('diff' + capitalize(state.difficulty));
  return `<p class="pool-note" id="poolNote">${t('poolNote', size, diffLabel)}</p>`;
}

/* ============================================================
   Render: Landing
   ============================================================ */
function renderLanding() {
  setHTML(`
    <div class="landing page-fade">
      <div class="landing-card">
        <div class="flag-icon">🇸🇪</div>
        <h1 class="landing-title">${t('appTitle')}</h1>
        <p class="landing-subtitle">
          ${t('landingSubtitle')}<br>
          <span class="badge-pass">${t('passMarkBadge')}</span>
        </p>

        <hr class="divider" />

        <p class="length-label">${t('chooseQuestions')}</p>
        <div class="length-options" id="lengthOptions">
          ${CONFIG.TEST_LENGTHS.map(n => `
            <div class="length-card ${state.testLength === n ? 'active' : ''}"
                 data-length="${n}" role="button" tabindex="0">
              <span class="num">${n}</span>
              <span class="qs">${t('questionsWord')}</span>
            </div>`).join('')}
        </div>

        <hr class="divider" />

        <p class="length-label">${t('chooseDifficulty')}</p>
        <div class="diff-options" id="diffOptions">
          ${DIFF_OPTIONS.map(d => `
            <div class="diff-card ${state.difficulty === d ? 'active' : ''}"
                 data-diff="${d}" role="button" tabindex="0">
              <span class="diff-icon">${DIFF_ICONS[d]}</span>
              <span class="diff-label">${t('diff' + capitalize(d))}</span>
            </div>`).join('')}
        </div>

        <div id="poolNoteWrap">${diffPoolNoteHTML()}</div>
        <hr class="divider" />

        <button class="btn-primary" id="btnStart">${t('startBtn')}</button>

        <p class="landing-info">
          ${t('landingInfo1')}<br><br>
          ${t('landingInfo2')}
        </p>
        <p class="landing-disclaimer">
          ${t('landingDisclaimer')}
        </p>
      </div>
    </div>
    <button class="lang-toggle floating" id="btnLangToggle">${t('langToggle')}</button>
  `);

  // Length selection
  document.getElementById('lengthOptions').addEventListener('click', e => {
    const card = e.target.closest('[data-length]');
    if (!card) return;
    state.testLength = parseInt(card.dataset.length, 10);
    document.querySelectorAll('.length-card').forEach(c =>
      c.classList.toggle('active', parseInt(c.dataset.length, 10) === state.testLength)
    );
    document.getElementById('poolNoteWrap').innerHTML = diffPoolNoteHTML();
  });

  document.getElementById('lengthOptions').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('[data-length]');
      if (card) card.click();
    }
  });

  // Difficulty selection
  document.getElementById('diffOptions').addEventListener('click', e => {
    const card = e.target.closest('[data-diff]');
    if (!card) return;
    state.difficulty = card.dataset.diff;
    document.querySelectorAll('.diff-card').forEach(c =>
      c.classList.toggle('active', c.dataset.diff === state.difficulty)
    );
    document.getElementById('poolNoteWrap').innerHTML = diffPoolNoteHTML();
  });

  document.getElementById('diffOptions').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('[data-diff]');
      if (card) card.click();
    }
  });

  document.getElementById('btnStart').addEventListener('click', () => {
    state.questions      = selectQuestions(state.testLength);
    state.currentIndex   = 0;
    state.answers        = [];
    state.selectedOption = null;
    state.testLanguage   = state.lang;   // capture language test is taken in
    state.phase          = 'question';
    render();
  });

  document.getElementById('btnLangToggle').addEventListener('click', () => {
    state.lang = state.lang === 'en' ? 'sv' : 'en';
    render();
  });
}

/* ============================================================
   Render: Question
   ============================================================ */
function renderQuestion() {
  const q     = state.questions[state.currentIndex];
  const total = state.questions.length;
  const qNum  = state.currentIndex + 1;
  const opts  = qOptions(q);

  const diffChip = q.difficulty
    ? `<span class="diff-chip diff-chip--${q.difficulty}">${t('diff' + capitalize(q.difficulty))}</span>`
    : '';

  setHTML(`
    ${progressHeaderHTML(qNum, total)}
    <div class="question-page page-fade">
      <div class="chips-row">
        <span class="category-chip">${esc(tCat(q.category))}</span>${diffChip}
      </div>
      <p class="question-text">${esc(qText(q))}</p>

      <div class="options-grid" id="optionsGrid">
        ${opts.map((opt, i) => `
          <button class="option-btn ${state.selectedOption === i ? 'selected' : ''}"
                  data-idx="${i}" type="button">
            <span class="option-circle">${LETTERS[i]}</span>
            <span class="option-text">${esc(opt)}</span>
          </button>`).join('')}
      </div>

      <button class="btn-primary" id="btnSubmit"
              ${state.selectedOption === null ? 'disabled' : ''}>
        ${t('submitBtn')}
      </button>
    </div>`);

  document.getElementById('optionsGrid').addEventListener('click', e => {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    state.selectedOption = parseInt(btn.dataset.idx, 10);
    document.querySelectorAll('.option-btn').forEach(b =>
      b.classList.toggle('selected', parseInt(b.dataset.idx, 10) === state.selectedOption)
    );
    document.getElementById('btnSubmit').disabled = false;
  });

  document.getElementById('btnSubmit').addEventListener('click', () => {
    if (state.selectedOption === null) return;
    const isCorrect = state.selectedOption === q.correct_index;
    state.answers.push({ question: q, selectedIndex: state.selectedOption, isCorrect });
    state.phase = 'feedback';
    render();
  });

  bindExitBtn();
  bindLangToggle(true);
}

/* ============================================================
   Render: Feedback
   ============================================================ */
function renderFeedback() {
  const { question: q, selectedIndex, isCorrect } = state.answers[state.answers.length - 1];
  const total  = state.questions.length;
  const qNum   = state.currentIndex + 1;
  const isLast = state.currentIndex === total - 1;
  const opts   = qOptions(q);

  const yourAnswer    = opts[selectedIndex];
  const correctAnswer = opts[q.correct_index];

  const answerBoxHTML = isCorrect
    ? `<div class="answer-box">
         <div class="answer-row correct-answer">
           <span class="answer-row-label">${t('yourAnswer')}</span>
           <span class="answer-row-value">${esc(correctAnswer)}</span>
         </div>
       </div>`
    : `<div class="answer-box">
         <div class="answer-row your-answer">
           <span class="answer-row-label">${t('yourAnswer')}</span>
           <span class="answer-row-value">${esc(yourAnswer)}</span>
         </div>
         <div class="answer-row correct-answer">
           <span class="answer-row-label">${t('correctAnswer')}</span>
           <span class="answer-row-value">${esc(correctAnswer)}</span>
         </div>
       </div>`;

  // Distractor note — SV falls back to EN notes if SV-specific notes are absent
  let distractorHTML = '';
  if (!isCorrect) {
    const notes = state.lang === 'sv'
      ? (q.distractor_notes_sv || q.distractor_notes)
      : q.distractor_notes;
    const note = notes?.[selectedIndex];
    if (note) {
      distractorHTML = `
        <div class="distractor-card">
          <div class="distractor-eyebrow">${t('distractorLabel')}</div>
          <p class="distractor-body">${esc(note)}</p>
        </div>`;
    }
  }

  setHTML(`
    ${progressHeaderHTML(qNum, total)}
    <div class="feedback-page page-fade">
      <div class="result-banner ${isCorrect ? 'correct' : 'incorrect'}">
        <span class="result-icon">${isCorrect ? '✓' : '✗'}</span>
        <div>
          <div class="result-heading">${isCorrect ? t('resultCorrect') : t('resultIncorrect')}</div>
          ${!isCorrect ? `<p class="result-sub">${t('resultSub')}</p>` : ''}
        </div>
      </div>

      ${answerBoxHTML}

      <div class="explanation-card">
        <div class="explanation-eyebrow">${t('aboutAnswer')}</div>
        <p class="explanation-body">${esc(qExplanation(q))}</p>
      </div>

      ${distractorHTML}

      <button class="btn-primary" id="btnNext">
        ${isLast ? t('viewResults') : t('nextQuestion')}
      </button>
    </div>`);

  document.getElementById('btnNext').addEventListener('click', () => {
    if (isLast) {
      state.phase = 'summary';
    } else {
      state.currentIndex++;
      state.selectedOption = null;
      state.phase = 'question';
    }
    render();
  });

  bindExitBtn();
  bindLangToggle(true);
}

/* ============================================================
   Difficulty breakdown for summary score card
   ============================================================ */
function diffBreakdownHTML() {
  const levels = ['beginner', 'intermediate', 'expert'];
  const rows = levels.map(level => {
    const inTest  = state.answers.filter(a => a.question.difficulty === level);
    if (inTest.length === 0) return '';
    const correct = inTest.filter(a => a.isCorrect).length;
    return `<div class="diff-stat">
      <span class="diff-chip diff-chip--${level}">${t('diff' + capitalize(level))}</span>
      <span class="diff-stat-score">${correct}/${inTest.length}</span>
    </div>`;
  }).filter(Boolean).join('');
  return rows ? `<div class="diff-breakdown">${rows}</div>` : '';
}

/* ============================================================
   Render: Summary
   ============================================================ */
function renderSummary() {
  const isPartial     = state.answers.length < state.questions.length;
  const answeredCount = state.answers.length;
  const correct       = state.answers.filter(a => a.isCorrect).length;
  const wrong         = answeredCount - correct;
  const pct           = answeredCount > 0 ? correct / answeredCount : 0;
  const passed        = !isPartial && pct >= CONFIG.PASS_THRESHOLD;
  const pctDisp       = Math.round(pct * 100);

  const wrongAnswers = state.answers.filter(a => !a.isCorrect);
  const rightAnswers = state.answers.filter(a =>  a.isCorrect);

  const wrongHTML = wrongAnswers.length === 0
    ? `<p class="empty-state">${t('allCorrectState')}</p>`
    : wrongAnswers.map(a => {
        const opts = qOptionsOriginal(a.question);
        return `
          <div class="result-item wrong">
            <div class="result-item-cat">${esc(tCat(a.question.category))}</div>
            <div class="result-item-q">${esc(qTextOriginal(a.question))}</div>
            <div class="answer-tags answer-tags--stacked">
              <div class="atag-row">
                <span class="atag-label">${t('yourAnswer')}:</span>
                <span class="atag wrong"><span class="atag-text">${esc(opts[a.selectedIndex])}</span></span>
              </div>
              <div class="atag-row">
                <span class="atag-label">${t('correctAnswer')}:</span>
                <span class="atag right"><span class="atag-text">${esc(opts[a.question.correct_index])}</span></span>
              </div>
            </div>
            <div class="result-item-exp">${esc(qExplanationOriginal(a.question))}</div>
          </div>`;
      }).join('');

  const rightHTML = rightAnswers.length === 0
    ? `<p class="empty-state">${t('noneCorrectState')}</p>`
    : rightAnswers.map(a => {
        const opts = qOptionsOriginal(a.question);
        return `
          <div class="result-item right">
            <div class="result-item-cat">${esc(tCat(a.question.category))}</div>
            <div class="result-item-q">${esc(qTextOriginal(a.question))}</div>
            <div class="answer-tags">
              <span class="atag right">${t('correctAnswerTag', esc(opts[a.question.correct_index]))}</span>
            </div>
          </div>`;
      }).join('');

   setHTML(`
      <header class="summary-header">
        <div class="summary-left">
        </div>
        <div class="summary-center">
          <span class="summary-brand">🇸🇪 ${t('appTitle')}</span>
          <div class="summary-score">${passed ? t('passed') : t('notPassed')} ${pctDisp}%</div>
        </div>
        <div class="summary-right">
          <button class="lang-toggle floating" id="btnLangToggle">${t('langToggle')}</button>
        </div>
      </header>

    <div class="summary-page page-fade">

      <div class="score-card">
        ${isPartial ? `<div class="partial-banner">${t('partialBanner', answeredCount, state.questions.length)}</div>` : ''}
        <div class="score-pct">${pctDisp}%</div>
        <div class="score-fraction">${t('scoreOf', correct, answeredCount)}</div>
        ${!isPartial ? `
        <div class="result-pill ${passed ? 'passed' : 'failed'}">
          ${passed ? t('passed') : t('notPassed')}
        </div>
        <p class="result-note">
          ${passed
            ? t('passNote')
            : t('failNote', Math.ceil(answeredCount * 0.8))}
        </p>` : ''}
        <div class="score-stats">
          <div class="stat-block">
            <div class="stat-num c">${correct}</div>
            <div class="stat-label">${t('statCorrect')}</div>
          </div>
          <div class="stat-block">
            <div class="stat-num w">${wrong}</div>
            <div class="stat-label">${t('statIncorrect')}</div>
          </div>
          <div class="stat-block">
            <div class="stat-num t">${answeredCount}</div>
            <div class="stat-label">${t('statTotal')}</div>
          </div>
        </div>
        ${diffBreakdownHTML()}
        <button class="btn-restart" id="btnRestart">${t('startAgain')}</button>
      </div>

      <div class="summary-section">
        <div class="section-heading">
          <h2 class="wrong">${t('incorrectAnswersHeading')}</h2>
          <span class="section-count">${wrong}</span>
        </div>
        ${wrongHTML}
      </div>

      <div class="summary-section">
        <div class="section-heading">
          <h2 class="correct">${t('correctAnswersHeading')}</h2>
          <span class="section-count">${correct}</span>
        </div>
        ${rightHTML}
      </div>

    </div>`);

  document.getElementById('btnRestart').addEventListener('click', () => {
    state.phase          = 'landing';
    state.currentIndex   = 0;
    state.answers        = [];
    state.selectedOption = null;
    state.questions      = [];
    render();
  });

  document.getElementById('btnLangToggle').addEventListener('click', () => {
    showLangSwitchNotification();
  });
}

/* ============================================================
   Main render dispatcher
   ============================================================ */
function render() {
  document.documentElement.lang = state.lang;
  switch (state.phase) {
    case 'landing':  renderLanding();  break;
    case 'question': renderQuestion(); break;
    case 'feedback': renderFeedback(); break;
    case 'summary':  renderSummary();  break;
  }
}

/* ============================================================
   Initialise
   ============================================================ */
async function init() {
  try {
    const res = await fetch('./questions/sweden.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.allQuestions = data.questions;
    state.phase = 'landing';
    render();
  } catch (err) {
    document.getElementById('app').innerHTML = `
      <div class="loading-screen">
        <p style="color:var(--red);font-weight:600">Failed to load questions</p>
        <p style="font-size:0.85rem;color:var(--text-muted);text-align:center;max-width:300px">
          ${esc(err.message)}<br><br>
          Make sure you're running this via a web server (not file://).
        </p>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
