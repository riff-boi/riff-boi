// music.js — the music theory behind the Learn screens: notes, chords, scales,
// and which scale fits which chords. Nothing here touches the page, so tools/check.mjs can test it.

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// A note is a number from 0 to 11 (C = 0, C# = 1 ... B = 11). This turns it into a name.
export function noteName(pc, flats) {
  return (flats ? FLAT_NAMES : SHARP_NAMES)[((pc % 12) + 12) % 12];
}

// What each distance from the root is called: 0 frets = R (root), 3 frets = b3, 7 frets = 5 ...
export const INTERVAL_NAMES = ['R', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

const NATURAL = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// "F#" or "Bb" → 0 to 11
export function noteNumber(name) {
  const accidental = name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0;
  return (NATURAL[name[0]] + accidental + 12) % 12;
}

// --- Chords ---

// Chord ending → the distances (in frets) of its notes from the root.
const CHORD_SHAPES = {
  '': [0, 4, 7], maj: [0, 4, 7], M: [0, 4, 7],
  m: [0, 3, 7], min: [0, 3, 7], '-': [0, 3, 7],
  5: [0, 7],
  dim: [0, 3, 6], o: [0, 3, 6], '°': [0, 3, 6],
  dim7: [0, 3, 6, 9], o7: [0, 3, 6, 9], '°7': [0, 3, 6, 9],
  aug: [0, 4, 8], '+': [0, 4, 8],
  sus2: [0, 2, 7], sus4: [0, 5, 7], sus: [0, 5, 7],
  6: [0, 4, 7, 9], m6: [0, 3, 7, 9], min6: [0, 3, 7, 9], '-6': [0, 3, 7, 9],
  7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11], M7: [0, 4, 7, 11], 'Δ': [0, 4, 7, 11], 'Δ7': [0, 4, 7, 11], ma7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10], min7: [0, 3, 7, 10], '-7': [0, 3, 7, 10],
  mmaj7: [0, 3, 7, 11], mM7: [0, 3, 7, 11], 'm(maj7)': [0, 3, 7, 11], minmaj7: [0, 3, 7, 11],
  m7b5: [0, 3, 6, 10], min7b5: [0, 3, 6, 10], '-7b5': [0, 3, 6, 10], 'ø': [0, 3, 6, 10], 'ø7': [0, 3, 6, 10],
  '7sus4': [0, 5, 7, 10], '7sus': [0, 5, 7, 10],
  9: [0, 4, 7, 10, 14], maj9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14], min9: [0, 3, 7, 10, 14],
  add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14],
  '7#5': [0, 4, 8, 10], aug7: [0, 4, 8, 10], '+7': [0, 4, 8, 10],
  '7b9': [0, 4, 7, 10, 13], '7#9': [0, 4, 7, 10, 15],
  13: [0, 4, 7, 10, 14, 21], m11: [0, 3, 7, 10, 14, 17],
};

function shapeFor(ending) {
  if (Object.hasOwn(CHORD_SHAPES, ending)) return CHORD_SHAPES[ending];
  // "AM7" must stay a major 7, so only ignore capitals when there is no "M" in the ending.
  const lower = ending.toLowerCase();
  if (!ending.includes('M') && Object.hasOwn(CHORD_SHAPES, lower)) return CHORD_SHAPES[lower];
  return null;
}

// What job a note does in its chord. Used for the "stop on these" advice.
function roleOf(distance, ending, isDim7) {
  if (distance === 0) return 'root';
  if (distance === 3 || distance === 4) return 'third';
  if ((distance === 2 || distance === 5) && ending.includes('sus')) return 'third';
  if (distance === 6 || distance === 7 || distance === 8) return 'fifth';
  if (distance === 10 || distance === 11) return 'seventh';
  if (distance === 9) return isDim7 ? 'seventh' : 'color';
  return 'color';
}

// "Am7" → { name, root, tones: [{ pc, distance, role }] }, or null if it isn't a chord we know.
export function parseChord(text) {
  let token = text.replace(/♯/g, '#').replace(/♭/g, 'b');
  if (/^[a-g]/.test(token)) token = token[0].toUpperCase() + token.slice(1);
  const match = token.match(/^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/);
  if (!match) return null;
  const [, rootName, ending, bassName] = match;
  const shape = shapeFor(ending);
  if (!shape) return null;
  const root = noteNumber(rootName);
  const isDim7 = /^(dim7|o7|°7)$/.test(ending);
  const tones = [];
  for (const fret of shape) {
    const distance = fret % 12;
    if (tones.some((t) => t.distance === distance)) continue;
    tones.push({ pc: (root + distance) % 12, distance, role: roleOf(distance, ending, isDim7) });
  }
  // A slash chord's bass note counts too (C/E has an E in it).
  if (bassName) {
    const bass = noteNumber(bassName);
    if (!tones.some((t) => t.pc === bass)) tones.push({ pc: bass, distance: (bass - root + 12) % 12, role: 'bass' });
  }
  return { name: token, rootName, bassName: bassName ?? null, root, ending, tones, isDim7 };
}

// "Am F C G" → the chords we could read, and the words we couldn't.
export function parseChords(text) {
  const words = text.split(/[\s,|;]+/).filter((w) => w && !/^[-–—>→/]+$/.test(w));
  const chords = [];
  const unreadable = [];
  for (const word of words) {
    const chord = parseChord(word);
    if (chord) chords.push(chord);
    else unreadable.push(word);
  }
  return { chords: chords.slice(0, 16), unreadable: unreadable.slice(0, 6) };
}

// What kind of chord it is, so we can suggest the right scale for it.
export function chordKind(chord) {
  const has = (d) => chord.tones.some((t) => t.distance === d && t.role !== 'bass');
  if (chord.isDim7) return 'dim7';
  if (has(3) && has(6) && has(10)) return 'm7b5';
  if (has(3) && has(6)) return 'dim';
  if (has(4) && has(10)) return 'dom';
  if (has(4)) return 'maj';
  if (has(3)) return 'min';
  return 'other';
}

// --- Scales ---

// distances: the scale's notes in frets from its home note. spellFrom: the major key it shares notes with
// (how many frets below the home note), used only to pick sharps or flats for the names.
export const SCALES = [
  { id: 'major', name: 'Major', distances: [0, 2, 4, 5, 7, 9, 11], spellFrom: 0, favor: 3, vibe: 'Bright and happy. The usual choice for major songs.' },
  { id: 'minor', name: 'Natural minor', distances: [0, 2, 3, 5, 7, 8, 10], spellFrom: 9, favor: 3, vibe: 'Dark and moody. The usual choice for minor songs.' },
  { id: 'dorian', name: 'Dorian', distances: [0, 2, 3, 5, 7, 9, 10], spellFrom: 2, favor: 1.5, vibe: 'Minor, but a little brighter. Funky and soulful.' },
  { id: 'mixo', name: 'Mixolydian', distances: [0, 2, 4, 5, 7, 9, 10], spellFrom: 7, favor: 1.5, vibe: 'Major with a bluesy edge. Rock, country and blues.' },
  { id: 'lydian', name: 'Lydian', distances: [0, 2, 4, 6, 7, 9, 11], spellFrom: 5, favor: 0.5, vibe: 'Dreamy and floating.' },
  { id: 'phrygian', name: 'Phrygian', distances: [0, 1, 3, 5, 7, 8, 10], spellFrom: 4, favor: 0.2, vibe: 'Dark and Spanish-sounding.' },
  { id: 'locrian', name: 'Locrian', distances: [0, 1, 3, 5, 6, 8, 10], spellFrom: 11, favor: 0, vibe: 'Unstable. Made for half-diminished chords.' },
  { id: 'harmonic', name: 'Harmonic minor', distances: [0, 2, 3, 5, 7, 8, 11], spellFrom: 9, favor: 0.8, vibe: 'Dramatic and classical. Sounds great before a return to a minor chord.' },
  { id: 'melodic', name: 'Melodic minor', distances: [0, 2, 3, 5, 7, 9, 11], spellFrom: 9, favor: 0.4, vibe: 'Smooth, jazzy minor.' },
  { id: 'physdom', name: 'Phrygian dominant', distances: [0, 1, 4, 5, 7, 8, 10], spellFrom: 4, favor: 0.2, vibe: 'Flamenco color. Fits a 7 chord that goes to a minor chord.' },
  { id: 'dimwh', name: 'Diminished (whole-half)', distances: [0, 2, 3, 5, 6, 8, 9, 11], spellFrom: 0, favor: 0, vibe: 'Tense and even. Made for diminished 7 chords.' },
  { id: 'minpent', name: 'Minor pentatonic', distances: [0, 3, 5, 7, 10], spellFrom: 9, favor: 1.5, pentatonic: true, vibe: 'Only five notes. The rock and blues favorite. Hard to play a wrong note.' },
  { id: 'majpent', name: 'Major pentatonic', distances: [0, 2, 4, 7, 9], spellFrom: 0, favor: 1.5, pentatonic: true, vibe: 'Only five notes. Sweet and open. Good for country, pop and rock.' },
  { id: 'blues', name: 'Blues', distances: [0, 3, 5, 6, 7, 10], spellFrom: 9, favor: 1.2, pentatonic: true, vibe: 'Minor pentatonic plus the blue note (b5).' },
];
export const SCALE_BY_ID = Object.fromEntries(SCALES.map((s) => [s.id, s]));

// Small extra points for scales that suit a kind of chord.
const CHORD_FAVORS = {
  dom: { mixo: 3, majpent: 0.5, physdom: 0.3 },
  m7b5: { locrian: 4 },
  dim7: { dimwh: 4 },
  min: { minpent: 1, dorian: 0.5 },
  maj: { majpent: 0.5, lydian: 0.3 },
};

// A scale starting on a note: { root, def, notes } where notes is a Set of the notes in it.
export function makeScale(root, def) {
  return { root, def, notes: new Set(def.distances.map((d) => (d + root) % 12)) };
}
export const sameScale = (a, b) => Boolean(a && b && a.root === b.root && a.def.id === b.def.id);
export const scaleName = (scale, flats) => `${noteName(scale.root, flats)} ${scale.def.name}`;

// Notes matter differently: the root and 3rd say the most about a chord.
const NOTE_WEIGHT = { root: 2, third: 2, seventh: 1.5, fifth: 1, color: 0.5, bass: 0.5 };

// How much of a chord fits inside a scale, from 0 to 1.
export function coverage(chord, scaleNotes) {
  let total = 0;
  let found = 0;
  for (const tone of chord.tones) {
    total += NOTE_WEIGHT[tone.role];
    if (scaleNotes.has(tone.pc)) found += NOTE_WEIGHT[tone.role];
  }
  return found / total;
}

// Two scales with the same notes (A minor and C major) are listed once, with the other as "same notes as".
function removeTwins(sorted) {
  const seen = new Map();
  const kept = [];
  for (const scale of sorted) {
    const key = [...scale.notes].sort((a, b) => a - b).join();
    if (seen.has(key)) seen.get(key).twins.push(scale);
    else {
      scale.twins = [];
      seen.set(key, scale);
      kept.push(scale);
    }
  }
  return kept;
}

function topLists(sorted) {
  const list = removeTwins(sorted);
  return {
    best: list.filter((s) => !s.def.pentatonic).slice(0, 4),
    easy: list.filter((s) => s.def.pentatonic).slice(0, 2),
  };
}

// Scales that fit the whole song, best first. Also says if it looks like a blues song.
export function suggestForSong(chords) {
  const first = chords[0].root;
  const last = chords[chords.length - 1].root;
  const found = [];
  for (let root = 0; root < 12; root++) {
    for (const def of SCALES) {
      const scale = makeScale(root, def);
      const fit = chords.reduce((sum, c) => sum + coverage(c, scale.notes), 0) / chords.length;
      if (fit < (def.pentatonic ? 0.62 : 0.8)) continue;
      scale.fit = fit;
      // Fit matters most. Scales that start on the song's first chord (and last) get a bonus.
      scale.score = fit * 100 + def.favor + (first === root ? 4 : 0) + (last === root ? 1.5 : 0);
      found.push(scale);
    }
  }
  found.sort((a, b) => b.score - a.score);
  const { best, easy } = topLists(found);

  // A blues song: only major and 7 chords, built on the 1st, 4th and 5th notes. Play minor pentatonic over all of it.
  const kinds = chords.map(chordKind);
  let isBlues = kinds.every((k) => k === 'dom' || k === 'maj') && kinds.includes('dom');
  if (isBlues) {
    const gaps = chords.map((c) => (c.root - first + 12) % 12);
    isBlues = gaps.every((g) => g === 0 || g === 5 || g === 7) && gaps.some((g) => g !== 0);
  }
  let easyList = easy;
  if (isBlues) {
    const minor = makeScale(first, SCALE_BY_ID.minpent);
    const blues = makeScale(first, SCALE_BY_ID.blues);
    for (const s of [minor, blues]) Object.assign(s, { fit: 1, twins: [], tag: 'Classic blues choice' });
    easyList = [minor, blues];
  }
  const pick = isBlues ? easyList[0] : best[0] ?? easyList[0] ?? makeScale(first, SCALE_BY_ID.major);
  return { best, easy: easyList, pick, isBlues };
}

// Scales that fit one chord, best first. `current` is the scale already picked (we prefer staying in it).
export function suggestForChord(chord, current) {
  const kind = chordKind(chord);
  let minimum = 0.99;
  let found = [];
  const gather = () => {
    found = [];
    for (let root = 0; root < 12; root++) {
      for (const def of SCALES) {
        const scale = makeScale(root, def);
        const fit = coverage(chord, scale.notes);
        if (fit < minimum) continue;
        let shared = 0;
        for (const n of scale.notes) if (current.notes.has(n)) shared++;
        scale.fit = fit;
        scale.score = def.favor + (chord.root === root ? 5 : 0) + (CHORD_FAVORS[kind]?.[def.id] ?? 0)
          + (4 * shared) / Math.max(scale.notes.size, current.notes.size) + (sameScale(scale, current) ? 8 : 0);
        found.push(scale);
      }
    }
  };
  gather();
  if (!found.length) {
    minimum = 0.8;
    gather();
  }
  found.sort((a, b) => b.score - a.score);
  return topLists(found);
}

// Use flats (Bb) or sharps (A#) in the names? Follow what the player typed, else the key.
export function useFlats(chords, scale) {
  const names = chords.flatMap((c) => [c.rootName, c.bassName]).filter(Boolean);
  if (names.some((n) => n[1] === 'b')) return true;
  if (names.some((n) => n[1] === '#')) return false;
  const majorKey = (scale.root - scale.def.spellFrom + 120) % 12;
  return [5, 10, 3, 8, 1].includes(majorKey);
}

// The smoothest way from one chord to the next: a note to end on, and the note to step to.
export function nextMove(chord, next) {
  const from = chord.tones.filter((t) => t.role !== 'bass');
  const to = next.tones.filter((t) => t.role !== 'bass');
  const shared = from.filter((t) => to.some((u) => u.pc === t.pc)).map((t) => t.pc);
  const preferred = { third: 0, root: 1, seventh: 2, fifth: 3 };
  let best = null;
  for (const a of from) {
    for (const b of to) {
      const gap = (b.pc - a.pc + 12) % 12;
      const steps = Math.min(gap, 12 - gap);
      if (!steps) continue;
      const rank = preferred[b.role] ?? 4;
      if (!best || steps < best.steps || (steps === best.steps && rank < best.rank)) best = { from: a.pc, to: b.pc, steps, rank };
    }
  }
  return { shared, best };
}

// Spell a scale with the right letters: G major is G A B C D E F#, not G A B C D E Gb.
const LETTERS = 'CDEFGAB';
export function spellScale(rootName, distances) {
  const start = LETTERS.indexOf(rootName[0]);
  const root = noteNumber(rootName);
  return distances.map((fret, degree) => {
    const letter = LETTERS[(start + degree) % 7];
    const diff = (root + fret - NATURAL[letter] + 120) % 12;
    return letter + (diff === 0 ? '' : diff === 1 ? '#' : diff === 11 ? 'b' : diff === 2 ? '##' : 'bb');
  });
}

// --- Sound (so you can hear the notes) ---

let audioContext = null;

// Play a note: midi is the note number (60 = middle C).
export function playNote(midi, delay = 0, length = 1.2, volume = 0.18) {
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const start = audioContext.currentTime + delay;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, start);
    filter.frequency.exponentialRampToValueAtTime(500, start + length);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(start);
    osc.stop(start + length + 0.05);
  } catch (err) {
    console.error(err); // no sound is fine, the screen still works
  }
}

// Play several notes one after another.
export function playNotes(midiList, gap = 0.3) {
  midiList.forEach((midi, i) => playNote(midi, i * gap, 0.9, 0.2));
}

// Strum a chord: its notes, low to high, a little apart.
export function strumChord(chord) {
  const base = 40 + ((chord.root - 4 + 12) % 12);
  chord.tones.forEach((tone, i) => {
    const midi = tone.role === 'bass' ? 36 + tone.pc : tone.role === 'root' ? base : base + 12 + tone.distance;
    playNote(midi, i * 0.06, 1.6, 0.14);
  });
}
