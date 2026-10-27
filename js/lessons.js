// lessons.js — the Lessons screen: one short idea per card. Scroll down for the next one.
// Each card is [topic, title, one sentence, example lines (| starts a new line), notes to play (optional)].

import { playNotes } from './music.js';
import { loadProgress, toggleLesson } from './progress.js';

const $ = (id) => document.getElementById(id);

const C_MAJOR = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83]; // C D E F G A B and again an octave up
const mode = (start) => C_MAJOR.slice(start, start + 8); // a mode is the same notes, started later

const CARDS = [
  ['Basics', '12 notes', 'Music has 12 notes. Then they repeat.', 'C C# D D# E F F# G G# A A# B'],
  ['Basics', 'One fret', 'One fret up = one half step.', 'E → F → F# → G', [64, 65, 66, 67]],
  ['Basics', 'Half and whole', 'Half step = 1 fret. Whole step = 2 frets.', 'E → F: half|E → F#: whole', [64, 65, 64, 66]],
  ['Basics', 'No sharps here', 'B to C and E to F have no note between.', 'B C|E F'],
  ['Basics', 'Octave', '12 frets up is the same note, higher.', 'Open E = 12th fret E', [40, 52]],
  ['Basics', 'Tuning', 'Low to high.', 'E A D G B E', [40, 45, 50, 55, 59, 64]],
  ['Basics', 'Major 3rd', '4 frets up. Sounds happy.', 'C → E', [60, 64]],
  ['Basics', 'Minor 3rd', '3 frets up. Sounds sad.', 'C → Eb', [60, 63]],
  ['Basics', 'Perfect 5th', 'The strongest gap. Power chords use it.', 'C → G', [60, 67]],
  ['Basics', 'Tritone', '6 frets. Tense. Wants to move.', 'C → F#', [60, 66]],
  ['Scales', 'Major scale', 'Pattern: whole whole half whole whole whole half.', 'C D E F G A B C', C_MAJOR.slice(0, 8)],
  ['Scales', 'Minor scale', 'Darker. It starts on the 6th note of its major.', 'A B C D E F G A', [57, 59, 60, 62, 64, 65, 67, 69]],
  ['Scales', 'Relative minor', 'Every major has a minor with the same notes. 3 frets lower.', 'C major = A minor|G major = E minor'],
  ['Scales', 'Pentatonic', 'Five notes. Start your solos here.', 'A C D E G', [57, 60, 62, 64, 67, 69]],
  ['Scales', 'The blue note', 'Add one note to the minor pentatonic: the flat 5.', 'A C D Eb E G', [57, 60, 62, 63, 64, 67, 69]],
  ['Scales', 'Circle of fifths', 'Up a 5th adds a sharp. Up a 4th adds a flat.', 'C G D A E B'],
  ['Modes', 'What is a mode?', 'A major scale started on a different note.', 'C D E F G A B|Start on D = Dorian'],
  ['Modes', 'Ionian', 'The major scale. Bright and happy.', '1 2 3 4 5 6 7|C D E F G A B', mode(0)],
  ['Modes', 'Dorian', 'Minor with a lift. Funky and soulful.', '1 2 b3 4 5 6 b7|D E F G A B C', mode(1)],
  ['Modes', 'Phrygian', 'Dark. Spanish.', '1 b2 b3 4 5 b6 b7|E F G A B C D', mode(2)],
  ['Modes', 'Lydian', 'Dreamy. One raised note.', '1 2 3 #4 5 6 7|F G A B C D E', mode(3)],
  ['Modes', 'Mixolydian', 'Bluesy major. Rock and country.', '1 2 3 4 5 6 b7|G A B C D E F', mode(4)],
  ['Modes', 'Aeolian', 'The natural minor. Sad.', '1 2 b3 4 5 b6 b7|A B C D E F G', mode(5)],
  ['Modes', 'Locrian', 'Unstable. Rarely home.', '1 b2 b3 4 b5 b6 b7|B C D E F G A', mode(6)],
  ['Modes', 'Bright to dark', 'Lydian, Ionian, Mixolydian, Dorian, Aeolian, Phrygian, Locrian.', 'bright → dark'],
  ['Modes', 'Pick a mode', 'Look at the chord.', 'Major: Ionian or Lydian|Minor: Dorian or Aeolian|Dominant 7: Mixolydian'],
  ['Modes', 'Hear a mode', 'Loop one chord. Solo with the mode.', 'Dm7 loop → D Dorian'],
  ['Chords', '3 notes', 'Root, 3rd, 5th. Skip a note between each.', 'C E G', [60, 64, 67]],
  ['Chords', 'Major or minor', 'Only the 3rd changes.', 'C E G: happy|C Eb G: sad', [60, 64, 67, 60, 63, 67]],
  ['Chords', 'Power chord', 'Root and 5th. No 3rd. Not major or minor.', 'C G', [48, 55]],
  ['Chords', '7th chords', 'Add one more note on top.', 'Cmaj7: C E G B|C7: C E G Bb', [60, 64, 67, 71]],
  ['Chords', 'Sus chords', 'Swap the 3rd for a 2nd or 4th. Feels unfinished.', 'Csus2: C D G|Csus4: C F G', [60, 62, 67, 60, 65, 67]],
  ['Chords', 'Diminished', 'Two minor 3rds stacked. Very tense.', 'C Eb Gb', [60, 63, 66]],
  ['Chords', 'Slash chord', 'C/E is a C chord with E in the bass.', 'C/E'],
  ['Chords', 'Barre chord', 'One finger holds every string. Slide it to change chord.', 'E shape → slide up'],
  ['Songs', 'Chord numbers', 'In C, each chord has a number.', 'C=I Dm=ii Em=iii|F=IV G=V Am=vi'],
  ['Songs', 'Pop', 'The most used progression.', 'I V vi IV|C G Am F'],
  ['Songs', '12-bar blues', 'Twelve bars. Three chords.', 'I I I I IV IV|I I V IV I V'],
  ['Songs', 'ii V I', 'The main move in jazz.', 'Dm7 G7 Cmaj7'],
  ['Songs', 'Tension and release', 'V wants to go home to I. That pull is music.', 'G7 → C'],
  ['Songs', 'Minor key', 'Four chords. Epic feel.', 'Am F C G'],
  ['Songs', 'Borrowed chord', 'Take a chord from the minor key.', 'C Bb F C'],
  ['Rhythm', '4/4', 'Four beats per bar.', '1 2 3 4'],
  ['Rhythm', 'Eighth notes', 'Two notes per beat.', '1 & 2 & 3 & 4 &'],
  ['Rhythm', 'Strumming', 'Down on the beat. Up in between. Keep your hand moving.', 'D DU UDU'],
  ['Rhythm', 'Rests', 'Silence counts. Leave space.', '1 _ 3 _'],
  ['Rhythm', 'Tempo', 'BPM = beats per minute.', 'Slow 60|Medium 100|Fast 140'],
  ['Playing', 'Land on the 3rd', 'It tells the ear: major or minor.', 'Over Am: C'],
  ['Playing', 'Stop on chord notes', 'Beat 1 of each bar. Use other notes to move.', 'Over C: C E G'],
  ['Playing', 'Approach note', 'Play one fret below your target. Then land.', 'F# → G'],
  ['Playing', 'Repeat an idea', 'Say it twice. Change the end.', 'A C D | A C E'],
  ['Playing', 'Leave space', 'Rest between phrases. Fewer notes sound better.', 'Play. Rest. Play.'],
  ['Playing', 'Bend to the 3rd', 'Over a dominant chord, bend the flat 3rd up.', 'b3 ↗ 3'],
  ['Playing', 'Go slow', 'Slow and clean beats fast and messy.', '60 BPM → 65 → 70'],
  ['Playing', 'Capo', 'One fret = one half step up. Same shapes.', 'Capo 2: G shape sounds A'],
];

// How many lessons there are, for the progress line on the home screen.
export const LESSON_COUNT = CARDS.length;
const lessonId = ([topic, title]) => `${topic}:${title}`;

const TOPICS = ['All', 'Basics', 'Scales', 'Modes', 'Chords', 'Songs', 'Rhythm', 'Playing'];
let topic = 'All';

function drawTopics() {
  $('lesson-topics').innerHTML = TOPICS.map((t) => `<button type="button" class="chip-small" data-topic="${t}" aria-pressed="${t === topic}">${t}</button>`).join('');
}

function drawCards() {
  const cards = CARDS.filter(([t]) => topic === 'All' || t === topic);
  const done = new Set(loadProgress().lessons);
  $('lesson-done').textContent = `${done.size} of ${CARDS.length} done`;
  $('lesson-feed').innerHTML = cards.map((card, i) => { const [t, title, sentence, example, notes] = card; return `<article class="lesson">
    <div class="lesson-top"><span class="lesson-tag">${t}</span><span class="lesson-count">${i + 1} / ${cards.length}</span></div>
    <h3 class="lesson-title">${title}</h3>
    <p class="lesson-text">${sentence}</p>
    ${example ? `<div class="lesson-example">${example.split('|').map((line) => `<div>${line}</div>`).join('')}</div>` : ''}
    <div class="lesson-buttons">
      ${notes ? `<button type="button" class="secondary-btn lesson-hear" data-notes="${notes.join(',')}">Hear it</button>` : ''}
      <button type="button" class="secondary-btn lesson-got" data-id="${lessonId(card)}" aria-pressed="${done.has(lessonId(card))}">${done.has(lessonId(card)) ? 'Done' : 'Got it'}</button>
    </div>
    <div class="lesson-hint">Scroll down for the next one</div>
  </article>`; }).join('');
  $('lesson-feed').scrollTop = 0;
}

// Wire up the Lessons screen once, when the app starts.
export function initLessons() {
  drawTopics();
  drawCards();
  $('lesson-topics').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    topic = button.dataset.topic;
    drawTopics();
    drawCards();
  });
  $('lesson-prev').addEventListener('click', () => $('lesson-feed').scrollBy({ top: -$('lesson-feed').clientHeight, behavior: 'smooth' }));
  $('lesson-next').addEventListener('click', () => $('lesson-feed').scrollBy({ top: $('lesson-feed').clientHeight, behavior: 'smooth' }));
  $('lesson-feed').addEventListener('click', (event) => {
    const hear = event.target.closest('.lesson-hear');
    if (hear) playNotes(hear.dataset.notes.split(',').map(Number));
    const got = event.target.closest('.lesson-got');
    if (got) {
      // Tick or untick this card without jumping back to the top of the list.
      const progress = toggleLesson(got.dataset.id);
      const isDone = progress.lessons.includes(got.dataset.id);
      got.textContent = isDone ? 'Done' : 'Got it';
      got.setAttribute('aria-pressed', String(isDone));
      $('lesson-done').textContent = `${progress.lessons.length} of ${CARDS.length} done`;
    }
  });
}
