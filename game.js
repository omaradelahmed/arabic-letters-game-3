/*!
 * شكل الحرف — حروفي ٣
 * لعبة تعليمية للأطفال من 3 إلى 6 سنوات: بص على الصورة، شوف مكان الحرف
 * الناقص في الكلمة، واختار شكله الصح (أول الكلمة / وسطها / آخرها).
 * لا موسيقى: كل الأصوات مولّدة بـ WebAudio، والكلام عبر speechSynthesis.
 */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* البيانات                                                            */
  /* ------------------------------------------------------------------ */

  // حرف الوصل: بيخلّي الحرف ياخد شكله المتصل (أول/وسط) لما نختبره
  const ZWJ = '\u200D';

  // الحركات والتطويل بيلزقوا في الحرف اللي قبلهم
  const MARK_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/;

  // الحروف اللي مبتوصلش بالحرف اللي بعدها — ملهاش شكل في الأول ولا في النص
  const NON_JOINING = new Set(['ا', 'أ', 'إ', 'آ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ة', 'ء', 'ى']);

  const LETTER_NAMES = {
    ب: 'باء', ت: 'تاء', ث: 'ثاء', ج: 'جيم', ح: 'حاء', خ: 'خاء',
    د: 'دال', ذ: 'ذال', ر: 'راء', ز: 'زاي', س: 'سين', ش: 'شين',
    ص: 'صاد', ض: 'ضاد', ط: 'طاء', ظ: 'ظاء', ع: 'عين', غ: 'غين',
    ف: 'فاء', ق: 'قاف', ك: 'كاف', ل: 'لام', م: 'ميم', ن: 'نون',
    ه: 'هاء', و: 'واو', ي: 'ياء',
  };

  const POSITION_LABEL = {
    begin: 'في أول الكلمة',
    middle: 'في وسط الكلمة',
    end: 'في آخر الكلمة',
  };

  /*
   * كل كلمة: الحرف الناقص + مكانه (index = رقم الحرف في الكلمة).
   * الحروف المختارة كلها من الحروف اللي بتتوصل، عشان يكون ليها 3 أشكال.
   */
  const WORDS = [
    // كلمات اللعبتين القديمتين
    { word: 'سُكَّر', emoji: '🍬', letter: 'س', pos: 'begin', index: 0 },
    { word: 'سُكَّر', emoji: '🍬', letter: 'ك', pos: 'middle', index: 1 },

    { word: 'نَمْلَة', emoji: '🐜', letter: 'ن', pos: 'begin', index: 0 },
    { word: 'نَمْلَة', emoji: '🐜', letter: 'م', pos: 'middle', index: 1 },
    { word: 'نَمْلَة', emoji: '🐜', letter: 'ل', pos: 'middle', index: 2 },

    { word: 'تُفَّاح', emoji: '🍎', letter: 'ت', pos: 'begin', index: 0 },
    { word: 'تُفَّاح', emoji: '🍎', letter: 'ف', pos: 'middle', index: 1 },

    { word: 'تِمْسَاح', emoji: '🐊', letter: 'ت', pos: 'begin', index: 0 },
    { word: 'تِمْسَاح', emoji: '🐊', letter: 'م', pos: 'middle', index: 1 },
    { word: 'تِمْسَاح', emoji: '🐊', letter: 'س', pos: 'middle', index: 2 },

    { word: 'خِيَار', emoji: '🥒', letter: 'خ', pos: 'begin', index: 0 },
    { word: 'خِيَار', emoji: '🥒', letter: 'ي', pos: 'middle', index: 1 },

    { word: 'خُبْز', emoji: '🍞', letter: 'خ', pos: 'begin', index: 0 },
    { word: 'خُبْز', emoji: '🍞', letter: 'ب', pos: 'middle', index: 1 },

    { word: 'نُجُوم', emoji: '⭐', letter: 'ن', pos: 'begin', index: 0 },
    { word: 'نُجُوم', emoji: '⭐', letter: 'ج', pos: 'middle', index: 1 },

    { word: 'لُعْبَة', emoji: '🧸', letter: 'ل', pos: 'begin', index: 0 },
    { word: 'لُعْبَة', emoji: '🧸', letter: 'ع', pos: 'middle', index: 1 },
    { word: 'لُعْبَة', emoji: '🧸', letter: 'ب', pos: 'middle', index: 2 },

    { word: 'لَيْمُون', emoji: '🍋', letter: 'ل', pos: 'begin', index: 0 },
    { word: 'لَيْمُون', emoji: '🍋', letter: 'ي', pos: 'middle', index: 1 },
    { word: 'لَيْمُون', emoji: '🍋', letter: 'م', pos: 'middle', index: 2 },

    { word: 'لِسَان', emoji: '👅', letter: 'ل', pos: 'begin', index: 0 },
    { word: 'لِسَان', emoji: '👅', letter: 'س', pos: 'middle', index: 1 },

    { word: 'سِنْجَاب', emoji: '🐿️', letter: 'س', pos: 'begin', index: 0 },
    { word: 'سِنْجَاب', emoji: '🐿️', letter: 'ن', pos: 'middle', index: 1 },
    { word: 'سِنْجَاب', emoji: '🐿️', letter: 'ج', pos: 'middle', index: 2 },

    { word: 'تَاج', emoji: '👑', letter: 'ت', pos: 'begin', index: 0 },

    { word: 'رُطَب', emoji: '🌴', letter: 'ب', pos: 'end', index: 2 },
    { word: 'رِجْل', emoji: '🦵', letter: 'ل', pos: 'end', index: 2 },

    // كلمات جديدة عشان نوّع آخر الكلمة
    { word: 'قَلَم', emoji: '✏️', letter: 'ق', pos: 'begin', index: 0 },
    { word: 'قَلَم', emoji: '✏️', letter: 'ل', pos: 'middle', index: 1 },
    { word: 'قَلَم', emoji: '✏️', letter: 'م', pos: 'end', index: 2 },

    { word: 'سَمَك', emoji: '🐟', letter: 'س', pos: 'begin', index: 0 },
    { word: 'سَمَك', emoji: '🐟', letter: 'م', pos: 'middle', index: 1 },
    { word: 'سَمَك', emoji: '🐟', letter: 'ك', pos: 'end', index: 2 },

    { word: 'عَسَل', emoji: '🍯', letter: 'ع', pos: 'begin', index: 0 },
    { word: 'عَسَل', emoji: '🍯', letter: 'س', pos: 'middle', index: 1 },
    { word: 'عَسَل', emoji: '🍯', letter: 'ل', pos: 'end', index: 2 },

    { word: 'جَمَل', emoji: '🐪', letter: 'ج', pos: 'begin', index: 0 },
    { word: 'جَمَل', emoji: '🐪', letter: 'م', pos: 'middle', index: 1 },
    { word: 'جَمَل', emoji: '🐪', letter: 'ل', pos: 'end', index: 2 },

    { word: 'حَلِيب', emoji: '🥛', letter: 'ح', pos: 'begin', index: 0 },
    { word: 'حَلِيب', emoji: '🥛', letter: 'ل', pos: 'middle', index: 1 },
    { word: 'حَلِيب', emoji: '🥛', letter: 'ب', pos: 'end', index: 3 },

    { word: 'فِيل', emoji: '🐘', letter: 'ف', pos: 'begin', index: 0 },
    { word: 'فِيل', emoji: '🐘', letter: 'ي', pos: 'middle', index: 1 },
    { word: 'فِيل', emoji: '🐘', letter: 'ل', pos: 'end', index: 2 },

    { word: 'شَمْس', emoji: '☀️', letter: 'ش', pos: 'begin', index: 0 },
    { word: 'شَمْس', emoji: '☀️', letter: 'م', pos: 'middle', index: 1 },
    { word: 'شَمْس', emoji: '☀️', letter: 'س', pos: 'end', index: 2 },

    { word: 'بَيْت', emoji: '🏠', letter: 'ب', pos: 'begin', index: 0 },
    { word: 'بَيْت', emoji: '🏠', letter: 'ي', pos: 'middle', index: 1 },
    { word: 'بَيْت', emoji: '🏠', letter: 'ت', pos: 'end', index: 2 },

    { word: 'عَيْن', emoji: '👁️', letter: 'ع', pos: 'begin', index: 0 },
    { word: 'عَيْن', emoji: '👁️', letter: 'ي', pos: 'middle', index: 1 },
    { word: 'عَيْن', emoji: '👁️', letter: 'ن', pos: 'end', index: 2 },

    { word: 'نَهْر', emoji: '🌊', letter: 'ن', pos: 'begin', index: 0 },

    { word: 'قِطَّة', emoji: '🐈', letter: 'ق', pos: 'begin', index: 0 },

    { word: 'حِصَان', emoji: '🐴', letter: 'ح', pos: 'begin', index: 0 },
    { word: 'حِصَان', emoji: '🐴', letter: 'ص', pos: 'middle', index: 1 },

    { word: 'جَبَل', emoji: '🏔️', letter: 'ج', pos: 'begin', index: 0 },
    { word: 'جَبَل', emoji: '🏔️', letter: 'ب', pos: 'middle', index: 1 },
    { word: 'جَبَل', emoji: '🏔️', letter: 'ل', pos: 'end', index: 2 },

    { word: 'عِنَب', emoji: '🍇', letter: 'ع', pos: 'begin', index: 0 },
    { word: 'عِنَب', emoji: '🍇', letter: 'ن', pos: 'middle', index: 1 },
    { word: 'عِنَب', emoji: '🍇', letter: 'ب', pos: 'end', index: 2 },

    { word: 'كَلْب', emoji: '🐕', letter: 'ك', pos: 'begin', index: 0 },
    { word: 'كَلْب', emoji: '🐕', letter: 'ل', pos: 'middle', index: 1 },
    { word: 'كَلْب', emoji: '🐕', letter: 'ب', pos: 'end', index: 2 },

    { word: 'بَيْض', emoji: '🥚', letter: 'ب', pos: 'begin', index: 0 },
    { word: 'بَيْض', emoji: '🥚', letter: 'ي', pos: 'middle', index: 1 },
    { word: 'بَيْض', emoji: '🥚', letter: 'ض', pos: 'end', index: 2 },

    { word: 'خَيْط', emoji: '🧵', letter: 'خ', pos: 'begin', index: 0 },
    { word: 'خَيْط', emoji: '🧵', letter: 'ي', pos: 'middle', index: 1 },
    { word: 'خَيْط', emoji: '🧵', letter: 'ط', pos: 'end', index: 2 },

    { word: 'مِفْتَاح', emoji: '🔑', letter: 'م', pos: 'begin', index: 0 },
    { word: 'مِفْتَاح', emoji: '🔑', letter: 'ف', pos: 'middle', index: 1 },
    { word: 'مِفْتَاح', emoji: '🔑', letter: 'ت', pos: 'middle', index: 2 },

    { word: 'بَطَّة', emoji: '🦆', letter: 'ب', pos: 'begin', index: 0 },
    { word: 'بَطَّة', emoji: '🦆', letter: 'ط', pos: 'middle', index: 1 },
  ];

  const POSITIONS = ['begin', 'middle', 'end'];
  const STORAGE_KEY = 'hurouf3.v1';
  const NEXT_ROUND_MS = 2000;

  /* ------------------------------------------------------------------ */
  /* أدوات الحروف                                                        */
  /* ------------------------------------------------------------------ */

  function splitClusters(word) {
    const out = [];
    for (const ch of word) {
      if (MARK_RE.test(ch) && out.length) out[out.length - 1] += ch;
      else out.push(ch);
    }
    return out;
  }

  const baseOf = (cluster) => cluster[0];

  function positionOf(index, total) {
    if (index === 0) return 'begin';
    if (index === total - 1) return 'end';
    return 'middle';
  }

  // شكل الحرف حسب مكانه — بنستخدم حرف الوصل عشان نجبر الشكل يظهر
  function shapeFor(letter, pos) {
    if (pos === 'begin') return letter + ZWJ;
    if (pos === 'middle') return ZWJ + letter + ZWJ;
    return ZWJ + letter;
  }

  // بنتأكد إن كل كلمة مظبوطة: الحرف في مكانه، وليه 3 أشكال فعلاً
  function isValidRound(item) {
    const clusters = splitClusters(item.word);
    if (!Number.isInteger(item.index) || item.index < 0 || item.index >= clusters.length) return false;
    if (baseOf(clusters[item.index]) !== item.letter) return false;
    if (positionOf(item.index, clusters.length) !== item.pos) return false;
    if (NON_JOINING.has(item.letter)) return false;
    if (item.pos !== 'begin' && NON_JOINING.has(baseOf(clusters[item.index - 1]))) return false;
    return true;
  }

  const ROUNDS = WORDS.filter(isValidRound);

  /* ------------------------------------------------------------------ */
  /* عناصر الصفحة                                                        */
  /* ------------------------------------------------------------------ */

  const $ = (id) => document.getElementById(id);

  const el = {
    score: $('score'),
    best: $('best'),
    soundBtn: $('soundBtn'),
    prompt: $('prompt'),
    pictureCard: $('pictureCard'),
    pictureEmoji: $('pictureEmoji'),
    speakBtn: $('speakBtn'),
    wordLine: $('wordLine'),
    wordText: $('wordText'),
    wordGap: $('wordGap'),
    hintLetter: $('hintLetter'),
    hintName: $('hintName'),
    shapes: $('shapes'),
    startOverlay: $('startOverlay'),
    playBtn: $('playBtn'),
    confetti: $('confetti'),
  };

  const state = {
    playing: false,
    locked: true,
    score: 0,
    best: 0,
    sound: true,
    round: null,
    clusters: [],
    charStart: 0,
    charLen: 0,
    revealed: false,
    lastWord: '',
  };

  /* ------------------------------------------------------------------ */
  /* الحفظ المحلي                                                        */
  /* ------------------------------------------------------------------ */

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.best === 'number' && saved.best >= 0) state.best = saved.best;
      if (typeof saved.sound === 'boolean') state.sound = saved.sound;
    } catch {
      /* تجاهل */
    }
  }

  function saveSaved() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ best: state.best, sound: state.sound }));
    } catch {
      /* التخزين ممكن يكون معطّل */
    }
  }

  /* ------------------------------------------------------------------ */
  /* الأصوات (WebAudio — بدون ملفات ولا موسيقى)                          */
  /* ------------------------------------------------------------------ */

  let actx = null;

  function audioCtx() {
    if (!state.sound) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!actx) {
      try {
        actx = new AC();
      } catch {
        return null;
      }
    }
    if (actx.state === 'suspended') actx.resume().catch(() => {});
    return actx;
  }

  function tone({ freq, at = 0, dur = 0.2, type = 'sine', vol = 0.14 }) {
    const ctx = audioCtx();
    if (!ctx) return;
    const start = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  const sfx = {
    tap() {
      tone({ freq: 640, dur: 0.07, type: 'triangle', vol: 0.07 });
    },
    correct() {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        tone({ freq, at: i * 0.085, dur: 0.24, type: 'triangle', vol: 0.12 });
      });
    },
    wrong() {
      tone({ freq: 233, dur: 0.16, type: 'sawtooth', vol: 0.09 });
      tone({ freq: 175, at: 0.13, dur: 0.24, type: 'sawtooth', vol: 0.09 });
    },
  };

  /* ------------------------------------------------------------------ */
  /* الكلام                                                             */
  /* ------------------------------------------------------------------ */

  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let arVoice = null;
  let speakToken = 0;

  function findArabicVoice() {
    if (!synth) {
      document.body.classList.add('no-tts');
      return;
    }
    let voices = [];
    try {
      voices = synth.getVoices() || [];
    } catch {
      voices = [];
    }
    arVoice =
      voices.find((v) => /^ar[-_]EG/i.test(v.lang)) ||
      voices.find((v) => /^ar/i.test(v.lang)) ||
      null;
    document.body.classList.toggle('no-tts', !arVoice);
  }

  function speak(lines) {
    if (!synth || !arVoice || !state.sound || !lines.length) return;
    const token = ++speakToken;
    try {
      synth.cancel();
    } catch {
      /* تجاهل */
    }
    setTimeout(() => {
      if (token !== speakToken) return;
      for (const text of lines) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.voice = arVoice;
        utter.lang = arVoice.lang || 'ar-EG';
        utter.rate = 0.85;
        utter.pitch = 1.05;
        utter.volume = 1;
        try {
          synth.speak(utter);
        } catch {
          /* تجاهل */
        }
      }
    }, 80);
  }

  /* ------------------------------------------------------------------ */
  /* الرسم                                                              */
  /* ------------------------------------------------------------------ */

  function renderScore() {
    el.score.textContent = String(state.score);
    el.best.textContent = String(state.best);
  }

  function setPrompt(text, tone) {
    el.prompt.textContent = text;
    if (tone) el.prompt.dataset.tone = tone;
    else delete el.prompt.dataset.tone;
  }

  // بنحط الغطاء فوق مكان الحرف الناقص بالظبط، والكلمة كلها بتفضل متصلة
  function positionGap() {
    if (!state.round) return;
    const node = el.wordText.firstChild;
    if (!node) return;
    const range = document.createRange();
    try {
      range.setStart(node, state.charStart);
      range.setEnd(node, state.charStart + state.charLen);
    } catch {
      return;
    }
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
    if (!rects.length) return;

    const line = el.wordLine.getBoundingClientRect();
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    const top = Math.min(...rects.map((r) => r.top));
    const bottom = Math.max(...rects.map((r) => r.bottom));

    el.wordGap.style.left = `${left - line.left - 4}px`;
    el.wordGap.style.top = `${top - line.top - 3}px`;
    el.wordGap.style.width = `${right - left + 8}px`;
    el.wordGap.style.height = `${bottom - top + 6}px`;
  }

  function renderWord() {
    el.wordText.textContent = state.round.word;
    el.wordText.classList.remove('reveal');
    el.wordGap.classList.remove('revealed');
    requestAnimationFrame(() => {
      positionGap();
      requestAnimationFrame(positionGap);
    });
  }

  function renderShapes() {
    el.shapes.textContent = '';
    const order = shuffle(POSITIONS.slice());
    order.forEach((pos, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shape-btn';
      btn.dataset.pos = pos;
      const shape = shapeFor(state.round.letter, pos);
      btn.textContent = shape;
      btn.setAttribute('aria-label', `${shape} — شكل الحرف رقم ${i + 1}`);
      btn.addEventListener('click', () => choose(pos, btn));
      el.shapes.appendChild(btn);
    });
  }

  function renderHint() {
    el.hintLetter.textContent = state.round.letter;
    el.hintName.textContent = LETTER_NAMES[state.round.letter] || '';
  }

  /* ------------------------------------------------------------------ */
  /* منطق الجولات                                                        */
  /* ------------------------------------------------------------------ */

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  let queue = [];

  function nextRoundItem() {
    if (!queue.length) {
      queue = shuffle(ROUNDS.slice());
      // منكررش نفس الكلمة ورا بعضها
      if (queue.length > 1 && queue[0].word === state.lastWord) {
        [queue[0], queue[1]] = [queue[1], queue[0]];
      }
    }
    return queue.shift();
  }

  function nextRound() {
    const item = nextRoundItem();
    state.round = item;
    state.lastWord = item.word;
    state.clusters = splitClusters(item.word);
    state.charStart = state.clusters.slice(0, item.index).reduce((n, c) => n + c.length, 0);
    state.charLen = state.clusters[item.index].length;
    state.locked = false;
    state.revealed = false;

    el.pictureEmoji.textContent = item.emoji;
    el.pictureCard.classList.remove('correct', 'pop');
    void el.pictureCard.offsetWidth;
    el.pictureCard.classList.add('pop');

    setPrompt('شوف مكان الحرف الناقص — واختار شكله الصح');

    renderHint();
    renderWord();
    renderShapes();
    speak([item.word]);
  }

  function celebrate() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#8f7bff', '#2fc3a6', '#2fbf71', '#ff7b9c', '#ffd166'];
    for (let i = 0; i < 26; i += 1) {
      const piece = document.createElement('i');
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.25}s`;
      piece.style.animationDuration = `${0.9 + Math.random() * 0.6}s`;
      el.confetti.appendChild(piece);
      setTimeout(() => piece.remove(), 2300);
    }
  }

  function onCorrect(btn) {
    state.locked = true;
    state.revealed = true;

    btn.classList.add('correct');
    el.shapes.querySelectorAll('.shape-btn').forEach((other) => {
      if (other !== btn) other.classList.add('faded');
    });

    el.wordGap.classList.add('revealed');
    el.wordText.classList.add('reveal');

    el.pictureCard.classList.add('correct');
    sfx.correct();
    celebrate();

    state.score += 1;
    if (state.score > state.best) {
      state.best = state.score;
      saveSaved();
    }
    renderScore();

    const name = LETTER_NAMES[state.round.letter] || state.round.letter;
    setPrompt(`صح! «${name}» ${POSITION_LABEL[state.round.pos]}`, 'ok');
    speak(['أحسنت!']);

    setTimeout(() => {
      if (state.playing) nextRound();
    }, NEXT_ROUND_MS);
  }

  function onWrong(btn) {
    btn.classList.remove('wrong');
    void btn.offsetWidth;
    btn.classList.add('wrong');
    sfx.wrong();
    setPrompt('بص على مكان الحرف في الكلمة وجرّب تاني', 'bad');
    speak([state.round.word]);
    setTimeout(() => btn.classList.remove('wrong'), 520);
  }

  function choose(pos, btn) {
    if (!state.playing || state.locked) return;
    if (pos === state.round.pos) onCorrect(btn);
    else onWrong(btn);
  }

  function startGame() {
    audioCtx();
    state.playing = true;
    state.score = 0;
    state.lastWord = '';
    queue = [];
    renderScore();
    el.startOverlay.classList.add('hidden');
    nextRound();
  }

  /* ------------------------------------------------------------------ */
  /* الصوت: تشغيل/إيقاف                                                  */
  /* ------------------------------------------------------------------ */

  function applySoundUI() {
    el.soundBtn.textContent = state.sound ? '🔊' : '🔇';
    el.soundBtn.setAttribute('aria-pressed', String(state.sound));
    el.soundBtn.setAttribute('aria-label', state.sound ? 'إيقاف الصوت' : 'تشغيل الصوت');
  }

  function toggleSound() {
    state.sound = !state.sound;
    applySoundUI();
    saveSaved();
    if (!state.sound) {
      if (synth) {
        try {
          synth.cancel();
        } catch {
          /* تجاهل */
        }
      }
    } else {
      audioCtx();
      sfx.tap();
    }
  }

  /* ------------------------------------------------------------------ */
  /* التشغيل                                                            */
  /* ------------------------------------------------------------------ */

  loadSaved();
  renderScore();
  applySoundUI();
  findArabicVoice();
  if (synth) synth.onvoiceschanged = findArabicVoice;

  el.playBtn.addEventListener('click', () => {
    sfx.tap();
    startGame();
  });

  el.soundBtn.addEventListener('click', toggleSound);

  el.speakBtn.addEventListener('click', () => {
    sfx.tap();
    if (state.round) speak([state.round.word]);
  });

  window.addEventListener('resize', () => {
    if (state.round && !state.revealed) positionGap();
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (state.round && !state.revealed) positionGap();
    }, 250);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (state.round && !state.revealed) positionGap();
    }).catch(() => {});
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && synth) {
      try {
        synth.cancel();
      } catch {
        /* تجاهل */
      }
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js', { updateViaCache: 'none' })
        .then((reg) => reg.update().catch(() => {}))
        .catch(() => {});
    });
  }
})();
