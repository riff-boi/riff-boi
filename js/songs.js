// songs.js — the Songs library: ready-made pieces, each with one or more parts (like the tracks on a
// tab site). A guitar part is tab plus standard notation; any other instrument (a flute, say) is
// standard notation only, written at the pitch it sounds.
//
// Parts are written the short way, one entry per note with how long until the next note starts,
// counted in sixteenths (4 = a quarter note). A gap (a rest) just counts toward the note before it,
// the same as everywhere else in Riff Boi. Guitar notes: [string, fret, sixteenths].
// Other notes: ['A5', sixteenths], with # for sharp and b for flat.

import { TUNING } from './tab.js';
import { midiToName } from './notes.js';

export const SONGS = [
  {
    id: 'great-fairy-fountain',
    title: 'Great Fairy Fountain',
    from: 'The Legend of Zelda: Ocarina of Time',
    composer: 'Koji Kondo',
    arrangement: 'Flute & guitar duet, transcribed from the game\'s recording. The guitar part is the harp, at the real pitch; the flute plays the melody and the sparkle on beat 2. The intro and ending are in the full score.',
    bpm: 78,
    meter: '4/4',
    parts: [
      {
        name: 'Flute',
        instrument: 'flute',
        notes: [
          // bar 1
          ['A5', 4], ['G5', 1], ['D5', 1], ['Bb4', 1], ['G4', 1], ['F#5', 4], ['G5', 4],
          // bar 2
          ['G5', 4], ['F5', 1], ['C5', 1], ['A4', 1], ['F4', 1], ['E5', 4], ['F5', 4],
          // bar 3
          ['F5', 4], ['E5', 1], ['Bb4', 1], ['G4', 1], ['E4', 1], ['D#5', 4], ['E5', 4],
          // bar 4
          ['E5', 4], ['D5', 1], ['A4', 1], ['F4', 1], ['D4', 1], ['C#5', 4], ['D5', 4],
          // bar 5
          ['A5', 4], ['G5', 1], ['D5', 1], ['Bb4', 1], ['G4', 1], ['F#5', 4], ['G5', 4],
          // bar 6 (its last A is held into bar 7)
          ['Bb5', 4], ['A5', 1], ['D#5', 1], ['C5', 1], ['F#4', 1], ['G#5', 4], ['A5', 8],
          // bar 7
          ['Bb5', 1], ['D5', 1], ['Bb4', 1], ['G4', 1], ['A5', 4], ['Bb5', 4],
          // bar 8
          ['A5', 4], ['G5', 1], ['Bb4', 1], ['G4', 1], ['E4', 1], ['F5', 4], ['E5', 1], ['D5', 1], ['G5', 1], ['E5', 1],
        ],
      },
      {
        name: 'Guitar',
        instrument: 'guitar',
        notes: [
          // bar 1 (Bb)
          [6, 6, 1], [4, 8, 1], [3, 7, 1], [1, 5, 6], [3, 7, 1], [1, 5, 1], [2, 8, 1], [1, 8, 1], [1, 5, 1], [2, 8, 1], [3, 7, 1],
          // bar 2 (A)
          [5, 0, 1], [4, 7, 1], [3, 5, 1], [2, 8, 5], [5, 0, 1], [4, 7, 1], [2, 8, 1], [2, 6, 1], [1, 8, 1], [2, 8, 1], [2, 6, 1], [3, 5, 1],
          // bar 3 (G)
          [6, 3, 1], [3, 0, 1], [3, 3, 1], [1, 1, 5], [6, 3, 1], [3, 0, 1], [1, 1, 1], [1, 0, 1], [1, 3, 1], [1, 0, 1], [2, 1, 1], [3, 3, 1],
          // bar 4 (F)
          [6, 1, 1], [4, 3, 1], [3, 2, 1], [1, 0, 5], [6, 1, 1], [3, 2, 1], [1, 0, 1], [3, 7, 1], [2, 8, 1], [2, 6, 1], [1, 8, 1], [1, 6, 1],
          // bar 5 (Bb)
          [6, 6, 1], [4, 8, 1], [3, 7, 1], [1, 5, 6], [4, 8, 1], [2, 10, 1], [2, 8, 1], [1, 10, 1], [2, 10, 1], [2, 8, 1], [3, 7, 1],
          // bar 6 (A, then D)
          [5, 0, 1], [4, 7, 1], [3, 5, 1], [1, 8, 5], [4, 0, 1], [3, 7, 1], [1, 8, 1], [2, 10, 1], [1, 11, 1], [1, 10, 1], [1, 8, 1], [2, 10, 1],
          // bar 7 (G minor)
          [6, 3, 1], [3, 3, 1], [2, 3, 1], [1, 6, 5], [6, 3, 1], [3, 3, 1], [1, 6, 1], [1, 5, 1], [1, 8, 1], [1, 6, 1], [2, 8, 1], [3, 7, 1],
          // bar 8 (C)
          [5, 3, 1], [3, 5, 1], [1, 3, 1], [1, 6, 5], [5, 3, 1], [3, 5, 1], [1, 6, 1], [1, 3, 5],
        ],
      },
    ],
  },
];

const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// A note name like 'F#5' or 'Bb4' → its MIDI number (middle C, 'C4', is 60). null if it isn't one.
export function pitchOf(name) {
  const match = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!match) return null;
  const [, letter, accidental, octave] = match;
  return (Number(octave) + 1) * 12 + LETTERS[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
}

// A part's notes, the same kind a riff has (so the tab, staff and playback all work on them):
// each starts where the last one's sixteenths ran out, at the song's tempo. Returns { notes, endTime }.
export function partNotes(part, bpm) {
  const secondsPerSixteenth = 60 / bpm / 4;
  let sixteenths = 0;
  const notes = part.notes.map((entry) => {
    const t = sixteenths * secondsPerSixteenth;
    sixteenths += entry[entry.length - 1];
    if (part.instrument === 'guitar') {
      const [string, fret] = entry;
      const midi = TUNING[string - 1] + fret;
      return { midi, name: midiToName(midi), string, fret, t };
    }
    const midi = pitchOf(entry[0]);
    return { midi, name: midiToName(midi), t }; // no string or fret: it isn't played on a guitar
  });
  return { notes, endTime: sixteenths * secondsPerSixteenth };
}
