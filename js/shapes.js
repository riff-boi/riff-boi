// shapes.js — the Shapes screen: one position of a scale at a time, drawn as a small fret diagram.
// A "position" is a patch of the neck, 4 or 5 frets wide, that holds the scale's notes in easy reach.

import { INTERVAL_NAMES, SCALES, SCALE_BY_ID, noteName, makeScale, playNote, scaleName } from './music.js';

const OPEN_STRINGS = [64, 59, 55, 50, 45, 40]; // high e at the top, like the picture
const SHAPE_SCALES = ['minpent', 'majpent', 'blues', 'minor', 'major', 'dorian', 'mixo'];

// How many positions a scale has: one for each of its notes (a 5-note scale has 5 boxes).
export const positionCount = (def) => def.distances.length;

// The scale's notes in a window of frets. Each string needs at least 2 notes for it to be a good position.
function notesInWindow(scale, start, width) {
  const notes = [];
  OPEN_STRINGS.forEach((open, i) => {
    for (let fret = start; fret < start + width; fret++) {
      const pc = (open + fret) % 12;
      if (fret >= 0 && scale.notes.has(pc)) notes.push({ string: i, fret, pc });
    }
  });
  return notes;
}

// Position number k (0 = the first): where it starts, how wide it is, and the notes in it.
// It begins around the k-th note of the scale on the low E string, and picks the window where every string has 2+ notes.
export function findPosition(root, def, k) {
  const scale = makeScale(root, def);
  const lowE = (root + def.distances[k] - 4 + 120) % 12; // the fret of that note on the low E string
  // Five-note scales fit in 4 frets for most boxes (a few boxes need 5). Longer scales use 5.
  const widths = def.distances.length === 5 ? [4, 5] : [5, 6];
  for (const width of widths) {
    let best = null;
    for (const base of [lowE, lowE + 12]) {
      for (let start = Math.max(0, base - width + 1); start <= base; start++) {
        const notes = notesInWindow(scale, start, width);
        const perString = OPEN_STRINGS.map((_, i) => notes.filter((n) => n.string === i).length);
        if (Math.min(...perString) < 2) continue;
        // The position starts on this note: it must be the lowest note you play on the low E string.
        const lowestOnLowE = Math.min(...notes.filter((n) => n.string === 5).map((n) => n.fret));
        if ((OPEN_STRINGS[5] + lowestOnLowE) % 12 !== (root + def.distances[k]) % 12) continue;
        if (!best || notes.length > best.notes.length) best = { start, width, notes };
      }
      if (best) break;
    }
    if (best) return best;
  }
  // Rare fallback: a plain window right at the low E note.
  return { start: lowE, width: widths[0], notes: notesInWindow(scale, lowE, widths[0]) };
}

// --- The screen ---

const $ = (id) => document.getElementById(id);
const state = { root: 9, scaleId: 'minpent', position: 0, numbers: false };

function draw() {
  const def = SCALE_BY_ID[state.scaleId];
  const scale = makeScale(state.root, def);
  const flats = [5, 10, 3, 8, 1].includes((state.root - def.spellFrom + 120) % 12);
  if (state.position >= positionCount(def)) state.position = 0;
  const { start, width, notes } = findPosition(state.root, def, state.position);

  const first = start === 0 ? 0 : start; // the first fret column shown
  const columns = width + (start === 0 ? 1 : 0);
  const left = 44;
  const colWidth = 70;
  const top = 26;
  const gap = 36;
  const svgWidth = left + columns * colWidth + 10;
  const x = (fret) => left + (fret - first) * colWidth + colWidth / 2;
  let svg = `<svg viewBox="0 0 ${svgWidth} 250" role="img" aria-label="${scaleName(scale, flats)}, position ${state.position + 1}, frets ${start} to ${start + width - 1}">`;
  svg += `<rect x="${left}" y="14" width="${columns * colWidth}" height="${5 * gap + 24}" class="neck"/>`;
  for (let c = 0; c <= columns; c++) svg += `<line x1="${left + c * colWidth}" x2="${left + c * colWidth}" y1="14" y2="${14 + 5 * gap + 24}" class="${c === 0 && start === 0 ? 'nut-line' : 'fret'}"/>`;
  OPEN_STRINGS.forEach((_, i) => { svg += `<line x1="${left}" x2="${left + columns * colWidth}" y1="${top + i * gap}" y2="${top + i * gap}" class="string"/>`; });
  for (let c = 0; c < columns; c++) svg += `<text class="fret-number" x="${left + c * colWidth + colWidth / 2}" y="${top + 5 * gap + 38}">${first + c}</text>`;
  for (const n of notes) {
    const isRoot = n.pc === scale.root;
    const label = state.numbers ? INTERVAL_NAMES[(n.pc - scale.root + 12) % 12] : noteName(n.pc, flats);
    svg += `<g class="dot ${isRoot ? 'dot-root' : 'dot-tone'}" data-midi="${OPEN_STRINGS[n.string] + n.fret}"><circle cx="${x(n.fret)}" cy="${top + n.string * gap}" r="14"/><text x="${x(n.fret)}" y="${top + n.string * gap}">${label}</text></g>`;
  }
  $('shape-board').innerHTML = `${svg}</svg>`;
  $('shape-info').textContent = `${scaleName(scale, flats)}, position ${state.position + 1} of ${positionCount(def)}. Frets ${start} to ${start + width - 1}.`;
  $('shape-positions').innerHTML = Array.from({ length: positionCount(def) }, (_, k) => `<button type="button" class="chip-small" data-position="${k}" aria-pressed="${k === state.position}">${k + 1}</button>`).join('');
}

export function initShapes() {
  $('shape-key').innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i}"${i === state.root ? ' selected' : ''}>${noteName(i, false)}</option>`).join('');
  $('shape-scale').innerHTML = SHAPE_SCALES.map((id) => `<option value="${id}"${id === state.scaleId ? ' selected' : ''}>${SCALE_BY_ID[id].name}</option>`).join('');
  $('shape-key').addEventListener('change', (e) => { state.root = Number(e.target.value); draw(); });
  $('shape-scale').addEventListener('change', (e) => { state.scaleId = e.target.value; state.position = 0; draw(); });
  $('shape-positions').addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button) { state.position = Number(button.dataset.position); draw(); }
  });
  $('shape-labels').addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    for (const b of $('shape-labels').children) b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
    state.numbers = button.dataset.value === 'numbers';
    draw();
  });
  $('shape-board').addEventListener('click', (e) => {
    const dot = e.target.closest('.dot');
    if (dot) playNote(Number(dot.dataset.midi), 0, 1.3, 0.2);
  });
  draw();
}
