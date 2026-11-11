// theory.js — the Theory screen: short topics on notes, keys, chords, modes and more.
// Most of it is plain text in the lists below. The key picker, mode table and transposer are small tools.

import { noteNumber, spellScale, playNotes } from './music.js';

const $ = (id) => document.getElementById(id);

// --- Small helpers that build the HTML ---

const note = (text) => ({ cls: 'mono', html: text });
const bold = (text) => ({ cls: 'text', html: `<b>${text}</b>` });

// A table. Cells are plain strings, or note() / bold() for a different style.
function table(headings, rows) {
  const head = headings.map((h) => `<th>${h}</th>`).join('');
  const body = rows.map((row) => `<tr>${row.map((cell, i) => {
    const c = typeof cell === 'string' ? { cls: i === 0 ? 'first' : 'text', html: cell } : cell;
    return `<td class="${c.cls}">${c.html}</td>`;
  }).join('')}</tr>`).join('');
  return `<div class="table-scroll"><table class="learn-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}
const bullets = (items) => `<ul class="learn-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const numbered = (items) => `<ol class="learn-list">${items.map((i) => `<li>${i}</li>`).join('')}</ol>`;

// --- The topics. Each one: id, title, a one-line summary, and the content. ---

const TOPICS = [];
const topic = (id, title, summary, html) => TOPICS.push({ id, title, summary, html });

topic('start', 'Start here', 'Learn these six things first.',
  numbered(['Learn the notes on the low E and A strings.', 'Learn one key. Try G major or A minor.', 'A chord is the 1st, 3rd and 5th notes. The 3rd sets major or minor.', 'Learn the minor pentatonic box.', 'In solos, stop on chord notes.', 'Practice slowly, with a beat.'])
  + '<p>Tap a topic above to jump to it.</p>');

topic('fret', 'Fretboard', 'Each fret is one note higher.',
  '<p class="mono big">C C# D D# E F F# G G# A A# B</p>'
  + bullets(['12 notes. Then they repeat.', 'One fret = half step. Two frets = whole step.', 'No note between B and C, or E and F.', '12th fret = same note, one octave up.', 'Tuning, low to high: <b>E A D G B E</b>.', 'Octave shape: two strings up, two frets up. (Three frets across G to B.)'])
  + table(['String', 'Open', 'Notes by fret'], [
    ['6 (low)', note('E'), note('0 E · 1 F · 3 G · 5 A · 7 B · 8 C · 10 D · 12 E')],
    ['5', note('A'), note('0 A · 2 B · 3 C · 5 D · 7 E · 8 F · 10 G · 12 A')],
    ['4', note('D'), note('0 D · 2 E · 3 F · 5 G · 7 A · 9 B · 10 C · 12 D')],
    ['3', note('G'), note('0 G · 2 A · 4 B · 5 C · 7 D · 9 E · 10 F · 12 G')],
    ['2', note('B'), note('0 B · 1 C · 3 D · 5 E · 6 F · 8 G · 10 A · 12 B')],
    ['1 (high)', note('E'), note('0 E · 1 F · 3 G · 5 A · 7 B · 8 C · 10 D · 12 E')],
  ])
  + '<p><b>Reading tab:</b> 6 lines = 6 strings. Numbers = frets. h hammer-on, p pull-off, / slide, b bend, ~ vibrato, x mute.</p>');

topic('intervals', 'Intervals', 'The gap between two notes. Count the frets.',
  table(['Frets', 'Name', 'From C', 'Feel'], [
    [note('0'), bold('Unison'), note('C'), 'Same note'],
    [note('1'), bold('Minor 2nd'), note('Db'), 'Tense'],
    [note('2'), bold('Major 2nd'), note('D'), 'Neutral'],
    [note('3'), bold('Minor 3rd'), note('Eb'), 'Sad'],
    [note('4'), bold('Major 3rd'), note('E'), 'Happy'],
    [note('5'), bold('Perfect 4th'), note('F'), 'Open'],
    [note('6'), bold('Tritone'), note('Gb'), 'Very tense'],
    [note('7'), bold('Perfect 5th'), note('G'), 'Strong'],
    [note('8'), bold('Minor 6th'), note('Ab'), 'Wistful'],
    [note('9'), bold('Major 6th'), note('A'), 'Sweet'],
    [note('10'), bold('Minor 7th'), note('Bb'), 'Bluesy'],
    [note('11'), bold('Major 7th'), note('B'), 'Dreamy'],
    [note('12'), bold('Octave'), note('C'), 'Same note, higher'],
  ])
  + '<p>Past the octave: 9th = 2nd, 11th = 4th, 13th = 6th.</p>');

topic('keys', 'Keys', 'A key is 7 notes that fit together. Pick one.',
  '<p>Major scale: <span class="mono accent">W W H W W W H</span> (W = 2 frets, H = 1 fret).</p>'
  + '<div class="key-picker"><svg id="key-circle" viewBox="0 0 320 320" role="img" aria-label="Circle of fifths. Outer ring major keys, inner ring relative minors."></svg><div id="key-info"></div></div>'
  + bullets(['Clockwise: up a 5th, add a sharp.', 'Counter-clockwise: add a flat.', 'Relative minor: 3 frets below the major. Same notes.', 'Sharps order: F C G D A E B. Flats: the reverse.']));

topic('chords', 'Chords', 'Stack notes to make a chord.',
  table(['Chord', 'Symbol', 'Formula', 'Notes', 'Sound'], [
    [bold('Major'), note('C'), note('1 3 5'), note('C E G'), 'Happy'],
    [bold('Minor'), note('Cm'), note('1 b3 5'), note('C Eb G'), 'Sad'],
    [bold('Diminished'), note('Cdim'), note('1 b3 b5'), note('C Eb Gb'), 'Tense'],
    [bold('Augmented'), note('Caug'), note('1 3 #5'), note('C E G#'), 'Uneasy'],
    [bold('Sus 2'), note('Csus2'), note('1 2 5'), note('C D G'), 'Open'],
    [bold('Sus 4'), note('Csus4'), note('1 4 5'), note('C F G'), 'Hanging'],
    [bold('Power'), note('C5'), note('1 5'), note('C G'), 'Heavy'],
    [bold('6th'), note('C6'), note('1 3 5 6'), note('C E G A'), 'Sweet'],
    [bold('Dominant 7'), note('C7'), note('1 3 5 b7'), note('C E G Bb'), 'Bluesy'],
    [bold('Major 7'), note('Cmaj7'), note('1 3 5 7'), note('C E G B'), 'Dreamy'],
    [bold('Minor 7'), note('Cm7'), note('1 b3 5 b7'), note('C Eb G Bb'), 'Mellow'],
    [bold('Half-dim'), note('Cm7b5'), note('1 b3 b5 b7'), note('C Eb Gb Bb'), 'Dark'],
    [bold('Dim 7'), note('Cdim7'), note('1 b3 b5 bb7'), note('C Eb Gb A'), 'Very tense'],
    [bold('Add 9'), note('Cadd9'), note('1 3 5 9'), note('C E G D'), 'Shimmer'],
    [bold('Dominant 9'), note('C9'), note('1 3 5 b7 9'), note('C E G Bb D'), 'Funky'],
  ])
  + bullets(['<b>Slash chord:</b> C/E = C chord, E in the bass.', '<b>Inversion:</b> same notes, different note lowest.', '<b>Barre chord:</b> one finger holds all strings. Slide it to change chord.']));

topic('modes', 'Modes', 'Same notes. Different start. Different mood.',
  '<label class="inline-field"><span class="setting-label">Start note</span><select id="mode-root" class="input-select"><option>C</option><option>D</option><option>E</option><option>F</option><option selected>G</option><option>A</option><option>B</option></select></label>'
  + '<div id="mode-table"></div>'
  + bullets(['<b>Brightest to darkest:</b> Lydian, Ionian, Mixolydian, Dorian, Aeolian, Phrygian, Locrian.', '<b>How to hear one:</b> loop one chord. Solo with the mode.', '<b>How to pick:</b> look at the chord. Major: Ionian or Lydian. Minor: Dorian or Aeolian. Dominant 7: Mixolydian.', '<b>Parent trick:</b> D Dorian uses the notes of C major. Start on D.'])
  + '<h4 class="panel-label">More scales</h4>'
  + table(['Scale', 'Numbers', 'Mood'], [
    [bold('Major pentatonic'), note('1 2 3 5 6'), 'Sweet, open'],
    [bold('Minor pentatonic'), note('1 b3 4 5 b7'), 'Rock, blues'],
    [bold('Blues'), note('1 b3 4 b5 5 b7'), 'Gritty'],
    [bold('Harmonic minor'), note('1 2 b3 4 5 b6 7'), 'Dramatic'],
    [bold('Melodic minor'), note('1 2 b3 4 5 6 7'), 'Jazzy'],
    [bold('Whole tone'), note('1 2 3 #4 #5 b7'), 'Floating'],
    [bold('Chromatic'), note('All 12 notes'), 'Runs, tension'],
  ]));

topic('progressions', 'Progressions', 'Chord order in a song. Pick a key above.',
  '<p id="progression-key" class="muted"></p><div id="progression-list"></div>'
  + bullets(['I = home. V = tension. IV = away.', 'Cadence: chords that end a phrase. V to I is the strongest.', 'Numbers work in any key.']));

topic('shapes', 'Shapes', 'Patterns you can slide up the neck.',
  '<p>A minor pentatonic, box 1:</p>'
  + '<pre class="tab-example">e|--5--8--|\nB|--5--8--|\nG|--5--7--|\nD|--5--7--|\nA|--5--7--|\nE|--5--8--|</pre>'
  + bullets(['Slide the box to change key. Fret 3 = G. Fret 7 = B.', 'Five boxes link together to cover the neck.', '<b>CAGED:</b> five open chord shapes (C A G E D) that move up the neck.', '<b>Three notes per string:</b> good for fast runs.']));

topic('soloing', 'Soloing', 'Stop on chord notes. Move with the rest.',
  bullets(['Pick one scale for the song.', 'Beat 1: land on a chord note.', 'Best landing note: the 3rd.', 'Chord change? Aim for the new 3rd.', 'Approach: play one fret below, then land.', 'Repeat an idea. Change the end.', 'Rest. Space sounds good.'])
  + table(['Chord', 'Try'], [
    [bold('Major'), 'Major scale, major pentatonic, Lydian'],
    [bold('Minor'), 'Natural minor, Dorian, minor pentatonic'],
    [bold('Dominant 7'), 'Mixolydian, blues, major pentatonic'],
    [bold('Minor 7b5'), 'Locrian'],
    [bold('Dim 7'), 'Diminished scale'],
  ]));

topic('next', 'Next level', 'Ideas for later. Examples in C.',
  bullets(['<b>Borrowed chord:</b> take a chord from the minor key. Bb or Fm.', '<b>Secondary dominant:</b> a V7 that leads to another chord. D7 → G.', '<b>Tritone swap:</b> use Db7 instead of G7.', '<b>Modal vamp:</b> loop two chords. Dm7 – G7 for Dorian.', '<b>Pedal tone:</b> hold one bass note. Change the chords above it.', '<b>Substitution:</b> swap a chord for one with shared notes. Am for C.', '<b>Key change:</b> move the song up a step for a lift.']));

topic('technique', 'Technique', 'Ways to play a note.',
  table(['Name', 'Tab', 'What'], [
    [bold('Hammer-on'), note('5h7'), 'Tap a finger down. No pick.'],
    [bold('Pull-off'), note('7p5'), 'Pluck off the string.'],
    [bold('Slide'), note('5/7'), 'Glide to the next fret.'],
    [bold('Bend'), note('7b9'), 'Push the string up.'],
    [bold('Vibrato'), note('7~'), 'Small pitch wobble.'],
    [bold('Palm mute'), note('P.M.'), 'Rest your palm on the strings.'],
    [bold('Harmonic'), note('&lt;12&gt;'), 'Touch lightly at the 12th fret.'],
    [bold('Tapping'), note('t'), 'Tap with your picking hand.'],
  ]));

topic('ear', 'Ear training', 'Match intervals to songs you know.',
  table(['Gap', 'Song (going up)'], [
    [bold('Minor 2nd'), 'Jaws theme'],
    [bold('Major 2nd'), 'Frère Jacques'],
    [bold('Minor 3rd'), 'Smoke on the Water'],
    [bold('Major 3rd'), 'When the Saints Go Marching In'],
    [bold('Perfect 4th'), 'Here Comes the Bride'],
    [bold('Tritone'), 'The Simpsons theme'],
    [bold('Perfect 5th'), 'Star Wars main theme'],
    [bold('Major 6th'), 'My Bonnie Lies Over the Ocean'],
    [bold('Octave'), 'Somewhere Over the Rainbow'],
  ])
  + bullets(['Sing the root of every chord.', 'Hum a note. Find it on the guitar.', 'Play two notes. Name the gap.']));

topic('rhythm', 'Rhythm', 'When you play the notes.',
  table(['Note', 'Beats', 'Count'], [
    [bold('Whole'), note('4'), note('1')],
    [bold('Half'), note('2'), note('1 . 3')],
    [bold('Quarter'), note('1'), note('1 2 3 4')],
    [bold('Eighth'), note('½'), note('1 & 2 & 3 & 4 &')],
    [bold('Sixteenth'), note('¼'), note('1 e & a 2 e & a')],
  ])
  + bullets(['4/4 = four beats per bar. 3/4 = waltz.', '6/8 = two groups of three.', 'BPM = beats per minute. Slow 60. Medium 100. Fast 140.', 'Strum: down on the beat, up in between.', 'Keep your hand moving, even when you skip a strum.']));

topic('songs', 'Songs', 'How songs are built.',
  table(['Part', 'Job'], [
    [bold('Intro'), 'Sets the mood'],
    [bold('Verse'), 'Tells the story'],
    [bold('Pre-chorus'), 'Builds tension'],
    [bold('Chorus'), 'The main hook'],
    [bold('Bridge'), 'A change of pace'],
    [bold('Solo'), 'Instrument takes over'],
    [bold('Outro'), 'The ending'],
  ])
  + bullets(['Common forms: verse–chorus, AABA, 12-bar blues.', 'To write: pick a key, pick a progression, hum a tune over it.']));

topic('practice', 'Practice', '20 minutes a day beats 2 hours once a week.',
  numbered(['5 min: slow scale to warm up.', '5 min: switch between two chords to a beat.', '5 min: learn one new thing.', '5 min: play a song.'])
  + bullets(['Use a metronome.', 'Start slow. Add 5 BPM at a time.', 'Record yourself.', 'Stop if it hurts.']));

topic('capo', 'Capo and transposing', 'A capo moves every chord up.',
  '<div class="transpose-row"><input type="text" id="transpose-input" class="text-input" value="G C D Em" aria-label="Chords to transpose" autocomplete="off" spellcheck="false">'
  + '<label class="inline-field"><span class="setting-label">Shift</span><select id="transpose-by" class="input-select"></select></label></div>'
  + '<p id="transpose-out" class="transpose-out"></p>'
  + '<button type="button" id="transpose-open" class="secondary-btn">Open in Chords</button>'
  + bullets(['Capo fret = half steps up.', 'Example: capo 3 + G C D Em sounds like Bb Eb F Gm.']));

const GLOSSARY = [
  ['Arpeggio', 'Chord notes played one at a time.'], ['Barre chord', 'One finger holds all strings.'], ['Bend', 'Push a string to raise the pitch.'],
  ['Cadence', 'Chords that end a phrase.'], ['Capo', 'A clamp that raises all strings.'], ['Chord tone', 'A note in the chord.'],
  ['Chromatic', 'Notes outside the key.'], ['Diatonic', 'Notes inside the key.'], ['Dominant', 'The 5th chord (V).'],
  ['Hammer-on', 'Tap a finger down. No pick.'], ['Half step', 'One fret.'], ['Interval', 'The gap between two notes.'],
  ['Key', 'The home note and scale of a song.'], ['Legato', 'Smooth, connected notes.'], ['Mode', 'A scale started on another note.'],
  ['Modulation', 'Changing key mid-song.'], ['Octave', '12 frets. Same note, higher.'], ['Palm mute', 'Palm on strings. Muffled sound.'],
  ['Pentatonic', 'A five-note scale.'], ['Position', 'A 4 or 5 fret area of the neck.'], ['Power chord', 'Root and 5th. No 3rd.'],
  ['Progression', 'A chord sequence.'], ['Pull-off', 'Pluck a note by pulling a finger off.'], ['Relative minor', 'Minor key with the same notes as a major.'],
  ['Resolve', 'Move from tension to calm.'], ['Riff', 'A short repeated phrase.'], ['Root', 'The note a chord is named after.'],
  ['Scale degree', 'A note’s number in the scale.'], ['Slash chord', 'Chord with a set bass note, like C/E.'], ['Slide', 'Glide from one fret to another.'],
  ['Sus', '3rd swapped for the 2nd or 4th.'], ['Syncopation', 'Accents on off-beats.'], ['Tab', 'Notation showing string and fret.'],
  ['Tempo', 'Speed of the beat (BPM).'], ['Tonic', 'The home note or chord (I).'], ['Triad', 'A three-note chord.'],
  ['Tritone', 'Six frets. Very tense.'], ['Vibrato', 'A small wobble in pitch.'], ['Voicing', 'Which notes you play, and where.'], ['Whole step', 'Two frets.'],
];
topic('glossary', 'Glossary', 'Look up a word.',
  '<input type="text" id="glossary-search" class="text-input" placeholder="Search" aria-label="Search glossary" autocomplete="off"><dl id="glossary-list" class="glossary"></dl>');

// --- The key picker (circle of fifths) ---

const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const MINOR_KEYS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Bb', 'F', 'C', 'G', 'D'];
const SHARPS_IN_KEY = [0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1]; // negative = flats
const SHARP_ORDER = ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'];
const FLAT_ORDER = ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'];
const ALSO = { 6: 'Also Gb major.', 7: 'Also C# major.' };
const MAJOR_FRETS = [0, 2, 4, 5, 7, 9, 11];
const TRIADS = ['', 'm', 'm', '', '', 'm', 'dim'];
const SEVENTHS = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
const NUMERALS = { major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], minor: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] };
const startAtSixth = (list) => list.slice(5).concat(list.slice(0, 5)); // a minor key is the major key started on its 6th note

const keyState = { index: 0, minor: false };

function currentKey() {
  const major = spellScale(MAJOR_KEYS[keyState.index], MAJOR_FRETS);
  const minor = keyState.minor;
  return {
    notes: minor ? startAtSixth(major) : major,
    triads: minor ? startAtSixth(TRIADS) : TRIADS,
    sevenths: minor ? startAtSixth(SEVENTHS) : SEVENTHS,
    numerals: minor ? NUMERALS.minor : NUMERALS.major,
    label: `${(minor ? startAtSixth(major) : major)[0]} ${minor ? 'minor' : 'major'}`,
  };
}

function drawCircle() {
  let svg = '';
  for (let i = 0; i < 12; i++) {
    const angle = ((-90 + i * 30) * Math.PI) / 180;
    const [ox, oy] = [160 + 122 * Math.cos(angle), 160 + 122 * Math.sin(angle)];
    const [ix, iy] = [160 + 74 * Math.cos(angle), 160 + 74 * Math.sin(angle)];
    svg += `<g class="key${!keyState.minor && keyState.index === i ? ' on' : ''}" data-index="${i}" data-minor="0"><circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="23"/><text x="${ox.toFixed(1)}" y="${oy.toFixed(1)}">${MAJOR_KEYS[i]}</text></g>`;
    svg += `<g class="key inner${keyState.minor && keyState.index === i ? ' on' : ''}" data-index="${i}" data-minor="1"><circle cx="${ix.toFixed(1)}" cy="${iy.toFixed(1)}" r="19"/><text x="${ix.toFixed(1)}" y="${iy.toFixed(1)}">${MINOR_KEYS[i]}m</text></g>`;
  }
  $('key-circle').innerHTML = `${svg}<text x="160" y="160" class="key-center">5ths</text>`;
}

function drawKeyInfo() {
  const key = currentKey();
  const n = SHARPS_IN_KEY[keyState.index];
  const signature = n === 0 ? 'None' : n > 0 ? `${n} sharp${n > 1 ? 's' : ''} (${SHARP_ORDER.slice(0, n).join(' ')})` : `${-n} flat${n < -1 ? 's' : ''} (${FLAT_ORDER.slice(0, -n).join(' ')})`;
  const relative = keyState.minor ? `${MAJOR_KEYS[keyState.index]} major` : `${MINOR_KEYS[keyState.index]} minor`;
  $('key-info').innerHTML = `<h4 class="panel-label">${key.label}</h4>
    <p><b>Notes:</b> <span class="mono accent">${key.notes.join(' ')}</span><br><b>Sharps/flats:</b> ${signature}${ALSO[keyState.index] ? ` ${ALSO[keyState.index]}` : ''}<br><b>Relative ${keyState.minor ? 'major' : 'minor'}:</b> ${relative}</p>`
    + table(['#', 'Numeral', 'Triad', '7th'], key.notes.map((name, d) => [note(String(d + 1)), note(key.numerals[d]), note(name + key.triads[d]), note(name + key.sevenths[d])]));
}

// Chord patterns, as positions in the key (0 = 1st note). `sevenths` uses 7th chords; `swap` replaces a chord's ending.
const MAJOR_PROGRESSIONS = [
  { name: 'Pop', degrees: [0, 4, 5, 3], about: 'I V vi IV. Used everywhere.' },
  { name: 'Fifties', degrees: [0, 5, 3, 4], about: 'I vi IV V. Doo-wop.' },
  { name: 'Three chords', degrees: [0, 3, 4], about: 'I IV V. Folk, country, rock.' },
  { name: 'Sad pop', degrees: [5, 3, 0, 4], about: 'vi IV I V. Pop chords, minor start.' },
  { name: 'Jazz cadence', degrees: [1, 4, 0], sevenths: true, about: 'ii V I. The jazz basic.' },
  { name: 'Turnaround', degrees: [0, 5, 1, 4], sevenths: true, about: 'I vi ii V. Loops back.' },
  { name: '12-bar blues', degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4], ending: '7', about: '4 bars I, 2 IV, 2 I, then V IV I V.' },
];
const MINOR_PROGRESSIONS = [
  { name: 'Epic minor', degrees: [0, 5, 2, 6], about: 'i VI III VII. Cinematic.' },
  { name: 'Andalusian', degrees: [0, 6, 5, 4], swap: { 3: '' }, about: 'i VII VI V. Flamenco, rock.' },
  { name: 'Minor three', degrees: [0, 3, 4], about: 'i iv v. Folk and blues.' },
  { name: 'Minor, major V', degrees: [0, 3, 4], swap: { 2: '' }, about: 'i iv V. Stronger pull home.' },
  { name: 'Minor jazz', degrees: [1, 4, 0], sevenths: true, swap: { 1: '7' }, about: 'ii° V i. Jazz in minor.' },
];

function drawProgressions() {
  const key = currentKey();
  $('progression-key').textContent = `Key of ${key.label}.`;
  const list = keyState.minor ? MINOR_PROGRESSIONS : MAJOR_PROGRESSIONS;
  $('progression-list').innerHTML = list.map((p) => {
    const chords = p.degrees.map((d, i) => {
      const ending = p.ending ?? p.swap?.[i] ?? (p.sevenths ? key.sevenths[d] : key.triads[d]);
      return key.notes[d] + ending;
    }).join(' ');
    return `<div class="progression"><span class="progression-name">${p.name}</span><span class="progression-chords">${chords}</span><span class="muted">${p.about}</span><button type="button" class="small-btn" data-chords="${chords}">Open in Chords</button></div>`;
  }).join('');
}

// --- Modes ---

const MODES = [
  ['Ionian (major)', [0, 2, 4, 5, 7, 9, 11], '1 2 3 4 5 6 7', 'Bright, happy', 'Major chords'],
  ['Dorian', [0, 2, 3, 5, 7, 9, 10], '1 2 b3 4 5 6 b7', 'Funky, soulful', 'm7 chords'],
  ['Phrygian', [0, 1, 3, 5, 7, 8, 10], '1 b2 b3 4 5 b6 b7', 'Dark, Spanish', 'Minor chords'],
  ['Lydian', [0, 2, 4, 6, 7, 9, 11], '1 2 3 #4 5 6 7', 'Dreamy', 'maj7 chords'],
  ['Mixolydian', [0, 2, 4, 5, 7, 9, 10], '1 2 3 4 5 6 b7', 'Bluesy, rock', '7 chords'],
  ['Aeolian (minor)', [0, 2, 3, 5, 7, 8, 10], '1 2 b3 4 5 b6 b7', 'Sad, moody', 'Minor chords'],
  ['Locrian', [0, 1, 3, 5, 6, 8, 10], '1 b2 b3 4 b5 b6 b7', 'Unstable', 'm7b5 chords'],
];

function drawModes() {
  const root = $('mode-root').value;
  $('mode-table').innerHTML = table(['Mode', 'Numbers', `Notes from ${root}`, 'Mood', 'Play over', ''], MODES.map(([name, frets, numbers, mood, over], i) => [
    bold(name), note(numbers), note(spellScale(root, frets).join(' ')), mood, over,
    { cls: 'text', html: `<button type="button" class="small-btn" data-mode="${i}">Hear</button>` },
  ]));
}

// --- Transposer ---

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function transposed() {
  const shift = Number($('transpose-by').value);
  const text = $('transpose-input').value;
  const names = shift < 0 || /[A-G]b/.test(text) ? FLAT_NAMES : SHARP_NAMES;
  const move = (name) => names[(((noteNumber(name) + shift) % 12) + 12) % 12];
  const out = text.split(/[\s,|;]+/).filter(Boolean).map((word) => {
    const m = word.replace(/♯/g, '#').replace(/♭/g, 'b').match(/^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/);
    return m ? move(m[1]) + m[2] + (m[3] ? `/${move(m[3])}` : '') : word;
  }).join(' ');
  $('transpose-out').textContent = out || ' ';
  return out;
}

// --- Glossary ---

function drawGlossary() {
  const q = $('glossary-search').value.toLowerCase().trim();
  const rows = GLOSSARY.filter(([word, meaning]) => !q || word.toLowerCase().includes(q) || meaning.toLowerCase().includes(q));
  $('glossary-list').innerHTML = rows.length ? rows.map(([w, m]) => `<dt>${w}</dt><dd>${m}</dd>`).join('') : '<dt>No match</dt><dd>Try another word.</dd>';
}

// Wire up the Theory screen once, when the app starts. `openChords` shows the Chords screen with some chords.
export function initTheory({ openChords }) {
  $('theory-body').innerHTML = TOPICS.map((t) => `<section class="topic" id="topic-${t.id}"><h3 class="panel-title">${t.title}</h3><p class="topic-summary">${t.summary}</p>${t.html}</section>`).join('');
  $('theory-jump').innerHTML = TOPICS.map((t) => `<button type="button" class="chip-small" data-topic="${t.id}">${t.title}</button>`).join('');
  $('theory-jump').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) $(`topic-${button.dataset.topic}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  drawCircle();
  drawKeyInfo();
  drawProgressions();
  $('key-circle').addEventListener('click', (event) => {
    const key = event.target.closest('.key');
    if (!key) return;
    keyState.index = Number(key.dataset.index);
    keyState.minor = key.dataset.minor === '1';
    drawCircle();
    drawKeyInfo();
    drawProgressions();
  });
  $('progression-list').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) openChords(button.dataset.chords);
  });

  drawModes();
  $('mode-root').addEventListener('change', drawModes);
  $('mode-table').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const base = 60 + noteNumber($('mode-root').value);
    playNotes([...MODES[Number(button.dataset.mode)][1], 12].map((d) => base + d));
  });

  $('transpose-by').innerHTML = Array.from({ length: 23 }, (_, i) => i - 11)
    .map((n) => `<option value="${n}"${n === 3 ? ' selected' : ''}>${n > 0 ? '+' : ''}${n}${n === 0 ? ' (none)' : ''}</option>`).join('');
  transposed();
  $('transpose-input').addEventListener('input', transposed);
  $('transpose-by').addEventListener('change', transposed);
  $('transpose-open').addEventListener('click', () => openChords(transposed()));

  drawGlossary();
  $('glossary-search').addEventListener('input', drawGlossary);
}
