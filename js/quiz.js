// quiz.js — the Quiz screen: 10 short questions. makeQuestion() is plain logic (tested in tools/check.mjs).

import { noteName, parseChord, playNotes, strumChord } from './music.js';
import { recordQuiz } from './progress.js';

const ROUND = 10;
const STRING_NAMES = ['low E', 'A', 'D', 'G', 'B', 'high e'];
const OPEN_NOTES = [40, 45, 50, 55, 59, 64]; // the open strings as note numbers, low E first
const INTERVALS = [
  [3, 'Minor 3rd'], [4, 'Major 3rd'], [5, 'Perfect 4th'], [6, 'Tritone'], [7, 'Perfect 5th'],
  [9, 'Major 6th'], [10, 'Minor 7th'], [11, 'Major 7th'], [12, 'Octave'],
];

const pick = (list, random) => list[Math.floor(random() * list.length)];

function shuffled(list, random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Make 4 choices: the right answer plus 3 different wrong ones, mixed up.
function choices(right, wrongPool, random) {
  const wrong = shuffled(wrongPool.filter((w) => w !== right), random).slice(0, 3);
  const options = shuffled([right, ...wrong], random);
  return { options, answer: options.indexOf(right) };
}

const ALL_NOTES = Array.from({ length: 12 }, (_, i) => noteName(i, false));

// One question: { prompt, options, answer (the index of the right option), explain, sound (note numbers to play) }.
export function makeQuestion(random = Math.random) {
  const type = pick(['fret', 'interval', 'third', 'chordNote'], random);

  if (type === 'fret') {
    const string = Math.floor(random() * 6);
    const fret = 1 + Math.floor(random() * 12);
    const right = noteName((OPEN_NOTES[string] + fret) % 12, false);
    return {
      prompt: `Which note is fret ${fret} on the ${STRING_NAMES[string]} string?`,
      ...choices(right, ALL_NOTES, random),
      explain: `The ${STRING_NAMES[string]} string, fret ${fret} is ${right}.`,
      sound: [OPEN_NOTES[string] + fret],
    };
  }

  if (type === 'interval') {
    const rootPc = Math.floor(random() * 12);
    const [frets, name] = pick(INTERVALS, random);
    const targetPc = (rootPc + frets) % 12;
    return {
      prompt: `${noteName(rootPc, false)} up to ${noteName(targetPc, false)}. What is the gap?`,
      ...choices(name, INTERVALS.map((i) => i[1]), random),
      explain: `${frets} frets up is a ${name}.`,
      sound: [60 + rootPc, 60 + rootPc + frets],
    };
  }

  if (type === 'third') {
    const rootPc = Math.floor(random() * 12);
    const major = random() < 0.5;
    const chord = parseChord(noteName(rootPc, false) + (major ? '' : 'm'));
    return {
      prompt: 'Listen to the chord. Major or minor?',
      options: ['Major', 'Minor'],
      answer: major ? 0 : 1,
      explain: major ? 'The 3rd is 4 frets up. That sounds happy: major.' : 'The 3rd is 3 frets up. That sounds sad: minor.',
      chord,
    };
  }

  const rootPc = Math.floor(random() * 12);
  const major = random() < 0.5;
  const chord = parseChord(noteName(rootPc, false) + (major ? '' : 'm'));
  const askThird = random() < 0.5;
  const tone = chord.tones.find((t) => t.role === (askThird ? 'third' : 'fifth'));
  const right = noteName(tone.pc, false);
  return {
    prompt: `What is the ${askThird ? '3rd' : '5th'} of ${chord.name}?`,
    ...choices(right, ALL_NOTES, random),
    explain: `${chord.name} is ${chord.tones.map((t) => noteName(t.pc, false)).join(' ')}. The ${askThird ? '3rd' : '5th'} is ${right}.`,
    sound: chord.tones.map((t) => 60 + t.pc),
  };
}

// --- The screen ---

const $ = (id) => document.getElementById(id);
let question = null;
let asked = 0;
let correct = 0;
let answered = false;

function showQuestion() {
  question = makeQuestion();
  answered = false;
  asked++;
  $('quiz-count').textContent = `Question ${asked} of ${ROUND}`;
  $('quiz-prompt').textContent = question.prompt;
  $('quiz-options').innerHTML = question.options.map((o, i) => `<button type="button" class="quiz-option" data-index="${i}">${o}</button>`).join('');
  $('quiz-feedback').textContent = '';
  $('quiz-next').hidden = true;
  $('quiz-hear').hidden = !(question.sound || question.chord);
  if (question.chord) strumChord(question.chord); // "listen" questions play right away
}

function showResult() {
  const progress = recordQuiz(correct);
  $('quiz-count').textContent = 'Done';
  $('quiz-prompt').textContent = `You got ${correct} of ${ROUND}.`;
  $('quiz-options').innerHTML = '';
  $('quiz-feedback').textContent = correct === progress.bestQuiz ? 'That is your best score.' : `Your best is ${progress.bestQuiz} of ${ROUND}.`;
  $('quiz-hear').hidden = true;
  $('quiz-next').hidden = false;
  $('quiz-next').textContent = 'Play again';
}

// Start a new round of questions.
export function startQuiz() {
  asked = 0;
  correct = 0;
  $('quiz-next').textContent = 'Next';
  showQuestion();
}

export function initQuiz() {
  $('quiz-options').addEventListener('click', (event) => {
    const button = event.target.closest('.quiz-option');
    if (!button || answered) return;
    answered = true;
    const chosen = Number(button.dataset.index);
    const right = chosen === question.answer;
    if (right) correct++;
    for (const b of $('quiz-options').children) {
      if (Number(b.dataset.index) === question.answer) b.classList.add('right');
      else if (b === button) b.classList.add('wrong');
    }
    $('quiz-feedback').textContent = `${right ? 'Right. ' : 'Not quite. '}${question.explain}`;
    $('quiz-next').hidden = false;
    $('quiz-next').textContent = asked >= ROUND ? 'See score' : 'Next';
  });
  $('quiz-next').addEventListener('click', () => {
    if ($('quiz-next').textContent === 'Play again') startQuiz();
    else if (asked >= ROUND) showResult();
    else showQuestion();
  });
  $('quiz-hear').addEventListener('click', () => {
    if (question.chord) strumChord(question.chord);
    else playNotes(question.sound, question.sound.length > 2 ? 0.06 : 0.5);
  });
}
