'use strict';

/* ============================================================
   UI String tables  (en + sv)
   ============================================================ */
const STRINGS = {
  en: {
    // General
    appTitle:        'Swedish Civics Test',
    langToggle:      '🇸🇪 Svenska',

    // Landing
    landingSubtitle:  'Practise for the Swedish citizenship knowledge test.',
    passMarkBadge:    'Pass mark: 80%',
    chooseQuestions:  'Choose number of questions',
    questionsWord:    'questions',
    chooseDifficulty: 'Choose difficulty',
    diffAll:          'All Levels',
    diffBeginner:     'Beginner',
    diffIntermediate: 'Intermediate',
    diffExpert:       'Expert',
    poolNote:         (size, diff) =>
      `Only <strong>${size}</strong> ${diff} questions available — your test will use all of them.`,
    startBtn:        'Start Test →',
    landingInfo1:    'Draws from 200 questions across 9 categories: Government &amp; Democracy, ' +
                      'History, Geography, Society &amp; Welfare, Rights &amp; Law, Culture, ' +
                      'Economy, Swedish Values, and Environment.',
    landingInfo2:    '',
    landingDisclaimer: 'Disclaimer: These practice questions have not been officially validated and are not affiliated with the Swedish government or UHR. The official test is being developed by UHR for August 2026. These questions are intended for study purposes only to help prepare for the official citizenship knowledge test.',

    // Progress header / question phase
    questionOf:  (n, total) => `Question ${n} of ${total}`,
    submitBtn:   'Submit Answer',

    // Feedback phase
    aboutAnswer:     'About this answer',
    yourAnswer:      'Your answer',
    correctAnswer:   'Correct answer',
    resultCorrect:   'Correct!',
    resultIncorrect: 'Incorrect',
    resultSub:       'The correct answer is shown below.',
    distractorLabel: 'Why you might have picked this',
    viewResults:     'View Results →',
    nextQuestion:    'Next Question →',

    // Summary phase
    startAgain:   'Start Again',
    scoreOf:      (correct, total) => `${correct} out of ${total} correct`,
    passed:       '🎉 PASSED',
    notPassed:    '✗ NOT PASSED',
    passNote:     'Well done! You met the 80% pass mark.',
    failNote:     (needed) => `You needed 80% to pass (${needed} correct). Keep practising!`,
    statCorrect:  'Correct',
    statIncorrect: 'Incorrect',
    statTotal:    'Total',
    incorrectAnswersHeading: '✗ Incorrect Answers',
    correctAnswersHeading:   '✓ Correct Answers',
    allCorrectState:  'You got every question correct — perfect score!',
    noneCorrectState: 'No correct answers this time — keep practising!',
    yourAnswerTag:    (ans) => `✗ Your answer: ${ans}`,
    correctAnswerTag: (ans) => `✓ Correct: ${ans}`,

    // Exit modal
    exitBtn:          '✕ Exit',
    exitModalTitle:   'Leave this test?',
    exitModalBody:    'Choose where you\'d like to go:',
    exitModalCancel:  'Keep going',
    exitModalStart:   '← Start page',
    exitModalResults: 'View partial results →',

    // Lang switch modal
    langModalTitle:   'Switch language?',
    langModalBody:    'Switching language will take you back to the start page. Your progress will be lost.',
    langModalCancel:  'Switch & restart',
    langModalConfirm: 'Keep going',

    // Partial summary
    partialBanner:    (n, total) => `Test ended early — you answered ${n} of ${total} questions.`,
  },

  sv: {
    // General
    appTitle:        'Samhällskunskapstest',
    langToggle:      '🇬🇧 English',

    // Landing
    landingSubtitle:  'Öva inför det svenska medborgarskapsprovet 2026.',
    passMarkBadge:    'Godkänt: 80%',
    chooseQuestions:  'Välj antal frågor',
    questionsWord:    'frågor',
    chooseDifficulty: 'Välj svårighetsgrad',
    diffAll:          'Alla nivåer',
    diffBeginner:     'Nybörjare',
    diffIntermediate: 'Medelnivå',
    diffExpert:       'Avancerad',
    poolNote:         (size, diff) =>
      `Endast <strong>${size}</strong> ${diff.toLowerCase()}-frågor tillgängliga — provet använder alla.`,
    startBtn:        'Starta provet →',
    landingInfo1:    'Innehåller 200 frågor inom 9 kategorier: Demokrati &amp; Styrning, ' +
                      'Historia, Geografi, Samhälle &amp; Välfärd, Rättigheter &amp; Lag, ' +
                      'Kultur &amp; Traditioner, Ekonomi, Svenska värderingar och Miljö &amp; Natur.',
    landingInfo2:    '',
    landingDisclaimer: 'Ansvarsfriskrivning: Dessa övningsfrågor har inte granskats officiellt och är inte knutna till Sveriges regering eller UHR. Det officiella provet utvecklas av UHR till augusti 2026. Dessa frågor är endast avsedda för studieändamål för att hjälpa till med förberedelserna inför det officiella kunskapsprovet för medborgarskap.',

    // Progress header / question phase
    questionOf:  (n, total) => `Fråga ${n} av ${total}`,
    submitBtn:   'Skicka svar',

    // Feedback phase
    aboutAnswer:     'Om detta svar',
    yourAnswer:      'Ditt svar',
    correctAnswer:   'Rätt svar',
    resultCorrect:   'Rätt!',
    resultIncorrect: 'Fel',
    resultSub:       'Rätt svar visas nedan.',
    distractorLabel: 'Varför du kanske valde detta',
    viewResults:     'Visa resultat →',
    nextQuestion:    'Nästa fråga →',

    // Summary phase
    startAgain:   'Börja om',
    scoreOf:      (correct, total) => `${correct} av ${total} rätt`,
    passed:       '🎉 GODKÄND',
    notPassed:    '✗ EJ GODKÄND',
    passNote:     'Bra jobbat! Du uppnådde 80% och är godkänd.',
    failNote:     (needed) => `Du behövde 80% för att klara provet (${needed} rätt). Fortsätt öva!`,
    statCorrect:  'Rätt',
    statIncorrect: 'Fel',
    statTotal:    'Totalt',
    incorrectAnswersHeading: '✗ Felaktiga svar',
    correctAnswersHeading:   '✓ Rätta svar',
    allCorrectState:  'Du svarade rätt på alla frågor — perfekt!',
    noneCorrectState: 'Inga rätta svar den här gången — fortsätt öva!',
    yourAnswerTag:    (ans) => `✗ Ditt svar: ${ans}`,
    correctAnswerTag: (ans) => `✓ Rätt: ${ans}`,

    // Exit modal
    exitBtn:          '✕ Avsluta',
    exitModalTitle:   'Lämna provet?',
    exitModalBody:    'Vad vill du göra?',
    exitModalCancel:  'Fortsätt',
    exitModalStart:   '← Startsida',
    exitModalResults: 'Visa delresultat →',

    // Lang switch modal
    langModalTitle:   'Byta språk?',
    langModalBody:    'Om du byter språk återgår du till startsidan. Dina svar sparas inte.',
    langModalCancel:  'Byt & börja om',
    langModalConfirm: 'Fortsätt',

    // Partial summary
    partialBanner:    (n, total) => `Provet avbröts — du svarade på ${n} av ${total} frågor.`,
  },
};

/* ============================================================
   Category name translations
   ============================================================ */
const CATEGORY_SV = {
  'Government & Democracy':    'Demokrati & Styrning',
  'History':                   'Historia',
  'Culture & Traditions':      'Kultur & Traditioner',
  'Society & Welfare':         'Samhälle & Välfärd',
  'Rights & Law':              'Rättigheter & Lag',
  'Swedish Values & Society':  'Svenska värderingar & samhälle',
  'Economy':                   'Ekonomi',
  'Geography':                 'Geografi',
  'Environment & Nature':      'Miljö & Natur',
};

/* ============================================================
   Translation helpers
   (Close over state.lang at call time — no import needed since
    i18n.js is loaded before app.js)
   ============================================================ */

/**
 * Look up a UI string key in the current language.
 * Falls back to English if the key is missing in the active language.
 * If the value is a function, calls it with any extra args.
 */
function t(key, ...args) {
  const table = STRINGS[state.lang] || STRINGS.en;
  const val   = (table[key] !== undefined) ? table[key] : STRINGS.en[key];
  return typeof val === 'function' ? val(...args) : val;
}

/**
 * Translate a question category name.
 */
function tCat(cat) {
  return state.lang === 'sv' ? (CATEGORY_SV[cat] || cat) : cat;
}
