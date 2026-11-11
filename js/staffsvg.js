// staffsvg.js — draws a riff in standard notation (the five-line staff), to go right above the tab.
// It uses the tab's layout (tabLayout in tabsvg.js), so every note sits straight above its fret
// number, and the bar lines line up too.
//
// Guitar music is written an octave higher than it sounds (so it fits on the treble staff), which
// is why the clef has a little 8 under it. The low E string is written as the E below the staff.
// Other instruments (a flute in a song) are written as they sound: no 8 (pass guitar: false).

import { tabLayout } from './tabsvg.js';
import { groupOf, barOf } from './rhythm.js';
import { TUNING } from './tab.js';

const LEFT = 6;               // where the staff starts (same as the tab)
const GAP = 10;               // space between two staff lines
const HALF = GAP / 2;         // one step on the staff (a line to the next space)
const STEM = 3.5 * GAP;       // a stem is three and a half spaces long
const BEAM_GAP = 6;           // between the first and second beam (sixteenths)
const HEAD_X = 5.6;           // half the width of a note head
const HEAD_Y = 4;             // half its height
const MIDDLE = 34;            // the middle line (B) as a step number (see stepOf)
const BOTTOM_LINE = 30;       // E, the bottom line
const TOP_LINE = 38;          // F, the top line
const GUITAR_UP = 12;         // guitar is written an octave higher than it sounds

// Note names with sharps, the same way the rest of Riff Boi names notes (A#, not Bb).
// Each is [letter (0 = C ... 6 = B), sharp?].
const SPELLING = [[0, false], [0, true], [1, false], [1, true], [2, false], [3, false], [3, true], [4, false], [4, true], [5, false], [5, true], [6, false]];

// Where a note goes on the staff, counted in steps (line, space, line...) from a low C.
// Middle C (written) is step 28, the bottom line E is 30, the middle line B is 34, the top line F is 38.
function stepOf(writtenMidi) {
  const octave = Math.floor(writtenMidi / 12) - 1;
  const [letter, sharp] = SPELLING[writtenMidi % 12];
  return { step: octave * 7 + letter, letter, octave, sharp };
}

// notes: the riff's notes (each needs `midi`, plus string, fret and t like for the tab).
// Takes the same options as tabSvg, so both pictures are laid out the same, plus `guitar`
// (true: written an octave up, with the 8 under the clef).
// Returns the picture as SVG text.
export function staffSvg(notes, { bpm = 120, endTime = null, meter = '4/4', timing = true, rhythm = true, bendArrows = true, highlightLast = false, guitar = true } = {}) {
  const { time, beats, xs, bars, end } = tabLayout(notes, { bpm, endTime, meter, timing, bendArrows });
  if (!timing) rhythm = false;
  const up = guitar ? GUITAR_UP : 0;
  const placed = notes.map((note) => stepOf((note.midi ?? TUNING[note.string - 1] + note.fret) + up));

  // How much room the notes need above and below the staff (high notes and their stems go up there).
  const steps = placed.map((p) => p.step);
  const highest = Math.max(TOP_LINE, ...steps);
  const lowest = Math.min(BOTTOM_LINE, ...steps);
  const top = 14 + (highest - TOP_LINE) * HALF + (rhythm ? STEM * 0.6 : 0); // y of the top line
  const y = (step) => top + (TOP_LINE - step) * HALF;
  const bottomLine = y(BOTTOM_LINE);
  const height = Math.max(y(lowest), bottomLine) + 14 + (rhythm ? STEM * 0.6 : 0);

  const parts = [];
  // The staff: five lines, a line at each end, the treble clef with its 8, and the time signature.
  for (let line = 0; line < 5; line++) parts.push(`<line class="s-line" x1="${LEFT}" y1="${top + line * GAP}" x2="${end}" y2="${top + line * GAP}"/>`);
  parts.push(`<line class="s-bar" x1="${LEFT}" y1="${top}" x2="${LEFT}" y2="${bottomLine}"/>`);
  parts.push(`<line class="s-bar" x1="${end}" y1="${top}" x2="${end}" y2="${bottomLine}"/>`);
  parts.push(trebleClef(LEFT + 16, y(32)));
  if (guitar) parts.push(`<text class="s-clef-8" x="${LEFT + 14}" y="${y(32) + 33}">8</text>`);
  if (timing) {
    parts.push(`<text class="s-time" x="${LEFT + 42}" y="${y(36)}">${time.top}</text><text class="s-time" x="${LEFT + 42}" y="${y(32)}">${time.bottom}</text>`);
  }
  for (const bar of bars) parts.push(`<line class="s-bar" x1="${bar.x}" y1="${top}" x2="${bar.x}" y2="${bottomLine}"/>`);

  // Sharps: once a note gets a sharp, the same note stays sharp until the bar line. So a sharp is
  // only drawn the first time in a bar, and a natural sign (♮) if the plain note comes back.
  const sharpNow = new Map(); // "letter,octave" → is it sharp right now in this bar?
  let bar = -1;
  const stemsUp = stemDirections(beats, placed, time, rhythm);

  notes.forEach((note, i) => {
    const p = placed[i];
    const x = xs[i];
    const ny = y(p.step);
    if (timing && barOf(beats[i].beat, time) !== bar) {
      bar = barOf(beats[i].beat, time);
      sharpNow.clear();
    }
    // Ledger lines: short extra lines for notes above or below the staff.
    for (let s = BOTTOM_LINE - 2; s >= p.step; s -= 2) parts.push(ledger(x, y(s)));
    for (let s = TOP_LINE + 2; s <= p.step; s += 2) parts.push(ledger(x, y(s)));
    // The sharp or natural sign, just left of the note.
    const key = `${p.letter},${p.octave}`;
    const wasSharp = sharpNow.get(key) ?? false;
    if (p.sharp !== wasSharp) parts.push(`<text class="s-accidental" x="${x - HEAD_X - 6}" y="${ny}">${p.sharp ? '♯' : '♮'}</text>`);
    sharpNow.set(key, p.sharp);

    const value = beats[i].value;
    const now = highlightLast && i === notes.length - 1 ? ' s-now' : '';
    const unsure = note.unsure ? ' s-unsure' : '';
    parts.push(noteHead(x, ny, value, note.harmonic, `${now}${unsure}`));
    if (value.dotted) parts.push(`<circle class="s-dot${now}${unsure}" cx="${x + HEAD_X + 5}" cy="${p.step % 2 === 0 ? ny - HALF : ny}" r="1.8"/>`);
  });

  if (rhythm) parts.push(stemsAndBeams(beats, xs, placed.map((p) => y(p.step)), stemsUp, time, y(MIDDLE)));

  const label = `Standard notation of ${notes.length} note${notes.length === 1 ? '' : 's'}`;
  return `<svg class="staff-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${end + 4} ${height}" width="${end + 4}" height="${height}" role="img" aria-label="${label}">${parts.join('')}</svg>`;
}

// The treble clef, drawn as lines (a font's 𝄞 sits differently on every computer). Its curl wraps
// around the G line, which is why it's also called the G clef. (0, 0) is where the curl ends, on G.
function trebleClef(x, gy) {
  const curl = 'M 1.5 -34 C 7 -42, 7 -50, 3 -51 C -2 -52, -4 -42, -3 -34 C -2 -27, 6 -21, 4 -15 C 1 -10, -10 -9, -10 0 C -10 8, -3 11, 3 10 C 9 9, 11 3, 10 -2 C 9 -8, 2 -10, -1 -7 C -4 -4, -2 1, 2 1';
  const line = 'M 3 -51 C 0 -40, 2 -12, 3 6 C 4 16, 3 21, -1 22';
  return `<g class="s-clef" transform="translate(${x} ${gy})"><path d="${curl}"/><path d="${line}"/><circle cx="-2.5" cy="19.5" r="3"/></g>`;
}

function ledger(x, ly) {
  return `<line class="s-ledger" x1="${x - HEAD_X - 4}" y1="${ly}" x2="${x + HEAD_X + 4}" y2="${ly}"/>`;
}

// A note head: filled for quarters and shorter, hollow for half and whole notes, a diamond for
// a natural harmonic. Tilted a little, like printed music.
function noteHead(x, ny, value, harmonic, extra) {
  const hollow = value.name === 'half' || value.name === 'whole';
  if (harmonic) {
    const points = `${x - HEAD_X},${ny} ${x},${ny - HEAD_Y - 1} ${x + HEAD_X},${ny} ${x},${ny + HEAD_Y + 1}`;
    return `<polygon class="s-head s-hollow${extra}" points="${points}"/>`;
  }
  return `<ellipse class="s-head${hollow ? ' s-hollow' : ''}${extra}" cx="${x}" cy="${ny}" rx="${HEAD_X}" ry="${HEAD_Y}" transform="rotate(-20 ${x} ${ny})"/>`;
}

const short = (v) => v.name === 'eighth' || v.name === 'sixteenth';

// Notes joined by a beam: runs of eighths and sixteenths in the same beam group (the same rule
// as the rhythm under the tab). Returns [first, last] note numbers for each run.
function beamRuns(beats, time) {
  const runs = [];
  let i = 0;
  while (i < beats.length) {
    if (!short(beats[i].value)) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < beats.length && short(beats[j + 1].value) && groupOf(beats[j + 1].beat, time) === groupOf(beats[i].beat, time)) j++;
    runs.push([i, j]);
    i = j + 1;
  }
  return runs;
}

// Stems go up for notes below the middle line and down for notes on it or above. Notes joined by
// a beam all point the same way, decided by the note furthest from the middle line.
function stemDirections(beats, placed, time, rhythm) {
  const up = placed.map((p) => p.step < MIDDLE);
  if (!rhythm) return up;
  for (const [i, j] of beamRuns(beats, time)) {
    if (i === j) continue;
    const run = placed.slice(i, j + 1).map((p) => p.step - MIDDLE);
    const furthest = run.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
    for (let k = i; k <= j; k++) up[k] = furthest < 0;
  }
  return up;
}

// Stems, flags and beams. A whole note has no stem. Beams are kept flat (level), placed past
// the note that sticks out the most, so every stem in the group reaches them.
function stemsAndBeams(beats, xs, ys, up, time, middle) {
  const marks = [];
  const stemX = (i) => (up[i] ? xs[i] + HEAD_X - 0.6 : xs[i] - HEAD_X + 0.6);
  // A note far above or below the staff gets a longer stem, reaching the middle line.
  const stemEnd = beats.map((_, i) => (up[i] ? Math.min(ys[i] - STEM, middle) : Math.max(ys[i] + STEM, middle)));
  const runs = beamRuns(beats, time);
  for (const [i, j] of runs) {
    if (i === j) continue;
    const level = up[i] ? Math.min(...stemEnd.slice(i, j + 1)) : Math.max(...stemEnd.slice(i, j + 1));
    for (let k = i; k <= j; k++) stemEnd[k] = level;
  }
  beats.forEach(({ value }, i) => {
    if (value.name === 'whole') return;
    marks.push(`<line class="s-stem" x1="${stemX(i)}" y1="${ys[i]}" x2="${stemX(i)}" y2="${stemEnd[i]}"/>`);
  });
  const inward = (i) => (up[i] ? BEAM_GAP : -BEAM_GAP); // the second beam sits inside the first
  for (const [i, j] of runs) {
    if (i === j) {
      // A lone eighth (one flag) or sixteenth (two flags).
      const flags = beats[i].value.name === 'sixteenth' ? 2 : 1;
      for (let f = 0; f < flags; f++) {
        const fy = stemEnd[i] + f * inward(i);
        const dir = up[i] ? 1 : -1;
        marks.push(`<path class="s-flag" d="M ${stemX(i)} ${fy} q 2 ${dir * 6} 8 ${dir * 10} q -2 ${-dir * 3} -8 ${-dir * 5}"/>`);
      }
      continue;
    }
    marks.push(`<line class="s-beam" x1="${stemX(i)}" y1="${stemEnd[i]}" x2="${stemX(j)}" y2="${stemEnd[j]}"/>`);
    for (let k = i; k <= j; k++) {
      if (beats[k].value.name !== 'sixteenth') continue;
      const by = stemEnd[k] + inward(k);
      // Second beam: to the next sixteenth, or a short stub if its neighbours are eighths.
      if (k < j && beats[k + 1].value.name === 'sixteenth') {
        marks.push(`<line class="s-beam" x1="${stemX(k)}" y1="${by}" x2="${stemX(k + 1)}" y2="${by}"/>`);
      } else if (!(k > i && beats[k - 1].value.name === 'sixteenth')) {
        const stub = k === j ? -8 : 8;
        marks.push(`<line class="s-beam" x1="${stemX(k)}" y1="${by}" x2="${stemX(k) + stub}" y2="${by}"/>`);
      }
    }
  }
  return marks.join('');
}
