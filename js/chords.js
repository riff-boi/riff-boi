// chords.js — the Chords screen. You type the chords you play; it shows scales that fit,
// where the notes are on the guitar, and which notes are best to play over each chord.

import {
  INTERVAL_NAMES, noteName, parseChords, makeScale, sameScale, scaleName, coverage,
  suggestForSong, suggestForChord, useFlats, nextMove, playNote, strumChord,
} from './music.js';

const $ = (id) => document.getElementById(id);

const state = {
  chords: [],
  unreadable: [],
  focus: -1, // which chord is picked: -1 means "All"
  song: null, // the scales that fit the whole song
  scale: null, // the scale showing on the guitar
  flats: false,
  numbers: false, // show 1 b3 5 instead of note names
  onlyChordNotes: false,
  area: false, // show one area of the neck instead of all of it
  areaStart: 4,
};

// --- The fretboard picture ---

const OPEN_STRINGS = [64, 59, 55, 50, 45, 40]; // note numbers of the open strings, high e at the top
const STRING_WIDTH = [1, 1.3, 1.7, 2.3, 3, 3.6];
const FRETS = 15;
const SCALE_LENGTH = 1725; // frets get closer together up the neck, like a real guitar
const NUT_X = 46;
const TOP_Y = 30;
const STRING_GAP = 34;
const fretX = (n) => NUT_X + SCALE_LENGTH * (1 - 2 ** (-n / 12));

// Which note is it, and what colour should its dot be?
function dotFor(pc, chord, scale) {
  const inScale = scale.notes.has(pc);
  if (!chord) return inScale ? { kind: pc === scale.root ? 'root' : 'tone' } : null;
  const tone = chord.tones.find((t) => t.pc === pc);
  if (tone) return { kind: tone.role === 'root' ? 'root' : 'tone', outside: !inScale };
  if (!inScale || state.onlyChordNotes) return null;
  // A scale note one fret above a chord note clashes with it a little.
  const clashes = chord.tones.some((t) => (t.pc + 1) % 12 === pc);
  return { kind: clashes ? 'clash' : 'scale' };
}

function drawBoard(chord) {
  const scale = state.scale;
  const width = Math.round(fretX(FRETS) + 18);
  const height = 252;
  const ref = chord ? chord.root : scale.root;
  let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Guitar neck showing ${chord ? chord.name : 'the scale'}">`;
  svg += `<rect x="2" y="14" width="${NUT_X - 2}" height="202" rx="6" class="neck-head"/>`;
  svg += `<rect x="${NUT_X}" y="14" width="${fretX(FRETS) - NUT_X + 10}" height="202" class="neck"/>`;
  if (state.area) {
    const x1 = state.areaStart === 0 ? NUT_X - 34 : fretX(state.areaStart - 1);
    svg += `<rect x="${x1}" y="8" width="${fretX(state.areaStart + 4) - x1}" height="214" rx="6" class="neck-area"/>`;
  }
  for (const n of [3, 5, 7, 9, 15]) svg += `<circle cx="${(fretX(n - 1) + fretX(n)) / 2}" cy="${TOP_Y + 2.5 * STRING_GAP}" r="6" class="inlay"/>`;
  const twelve = (fretX(11) + fretX(12)) / 2;
  svg += `<circle cx="${twelve}" cy="${TOP_Y + 1.5 * STRING_GAP}" r="6" class="inlay"/><circle cx="${twelve}" cy="${TOP_Y + 3.5 * STRING_GAP}" r="6" class="inlay"/>`;
  svg += `<rect x="${NUT_X - 4}" y="14" width="5" height="202" class="nut"/>`;
  for (let n = 1; n <= FRETS; n++) svg += `<line x1="${fretX(n)}" x2="${fretX(n)}" y1="14" y2="216" class="fret"/>`;
  OPEN_STRINGS.forEach((_, s) => {
    const y = TOP_Y + s * STRING_GAP;
    svg += `<line x1="${NUT_X}" x2="${fretX(FRETS) + 10}" y1="${y}" y2="${y}" class="string" stroke-width="${STRING_WIDTH[s]}"/>`;
  });
  for (const n of [3, 5, 7, 9, 12, 15]) svg += `<text class="fret-number" x="${(fretX(n - 1) + fretX(n)) / 2}" y="242">${n}</text>`;

  OPEN_STRINGS.forEach((open, s) => {
    for (let fret = 0; fret <= FRETS; fret++) {
      const midi = open + fret;
      const pc = midi % 12;
      const dot = dotFor(pc, chord, scale);
      if (!dot) continue;
      const x = fret === 0 ? NUT_X - 22 : (fretX(fret - 1) + fretX(fret)) / 2;
      const y = TOP_Y + s * STRING_GAP;
      const label = state.numbers ? INTERVAL_NAMES[(pc - ref + 12) % 12] : noteName(pc, state.flats);
      const dimmed = state.area && (fret < state.areaStart || fret > state.areaStart + 4 || (fret === 0 && state.areaStart > 0));
      svg += `<g class="dot dot-${dot.kind}${dot.outside ? ' dot-outside' : ''}${dimmed ? ' dot-dim' : ''}" data-midi="${midi}"><circle cx="${x}" cy="${y}" r="14"/><text x="${x}" y="${y}">${label}</text></g>`;
    }
  });
  $('chord-board').innerHTML = `${svg}</svg>`;

  const key = (kind, words) => `<span><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><g class="dot dot-${kind}"><circle cx="9" cy="9" r="7"/></g></svg>${words}</span>`;
  let legend;
  if (chord) {
    legend = key('root', 'Main note of the chord') + key('tone', 'Other chord notes');
    if (!state.onlyChordNotes) legend += key('scale', 'Other notes that fit') + key('clash', 'Play quickly');
    if (chord.tones.some((t) => !scale.notes.has(t.pc))) legend += `<span><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><g class="dot dot-tone dot-outside"><circle cx="9" cy="9" r="7"/></g></svg>Chord note not in scale</span>`;
  } else {
    legend = key('root', 'Home note of the scale') + key('tone', 'Other notes in the scale');
  }
  $('chord-legend').innerHTML = legend;
}

// --- The pieces around the fretboard ---

const chip = (index, title, small) => `<button type="button" role="tab" class="chip" data-index="${index}" aria-selected="${state.focus === index}"><span class="chip-name">${title}</span><span class="chip-notes">${small}</span></button>`;

function drawChips() {
  $('chord-tabs').innerHTML = chip(-1, 'All', 'whole song')
    + state.chords.map((c, i) => chip(i, c.name, c.tones.map((t) => noteName(t.pc, state.flats)).join(' '))).join('');
}

let shownScales = {}; // the scale buttons on screen, found again when you tap one

function scaleItem(scale, forChord) {
  const key = `${scale.root}:${scale.def.id}`;
  shownScales[key] = scale;
  const notes = scale.def.distances.map((d) => noteName((scale.root + d) % 12, state.flats)).join(' ');
  const full = scale.fit >= 0.99;
  const fitWords = scale.tag ?? (forChord ? (full ? 'Fits this chord' : 'Fits most of it') : (full ? 'Fits every chord' : 'Fits most chords'));
  const twins = (scale.twins ?? []).filter((t) => Boolean(t.def.pentatonic) === Boolean(scale.def.pentatonic)).slice(0, 2).map((t) => scaleName(t, state.flats));
  return `<button type="button" class="scale-item${sameScale(scale, state.scale) ? ' on' : ''}" data-key="${key}">
    <span class="scale-top"><b>${scaleName(scale, state.flats)}</b><em>${fitWords}</em></span>
    <span class="scale-notes">${notes}</span>
    <span class="scale-vibe">${scale.def.vibe}</span>
    ${twins.length ? `<span class="scale-twins">Same notes as ${twins.join(', ')}</span>` : ''}
  </button>`;
}

function drawScales(chord) {
  const lists = chord ? suggestForChord(chord, state.scale) : state.song;
  shownScales = {};
  const names = chord ? chord.name : state.chords.map((c) => c.name).join(' ');
  let html = `<h3 class="panel-title">Pick a scale</h3><p class="muted">These scales work over ${names}. Tap one to see it. The first is the best match.</p>`;
  // The scale on screen may have been picked from another list: keep it visible.
  const shown = [...lists.best, ...lists.easy];
  if (!shown.some((s) => sameScale(s, state.scale))) {
    state.scale.fit = chord ? coverage(chord, state.scale.notes) : state.chords.reduce((sum, c) => sum + coverage(c, state.scale.notes), 0) / state.chords.length;
    html += scaleItem(state.scale, Boolean(chord));
  }
  if (lists.best.length) html += `<h4 class="panel-label">Best matches</h4>${lists.best.map((s) => scaleItem(s, Boolean(chord))).join('')}`;
  if (lists.easy.length) html += `<h4 class="panel-label">Easiest to play</h4>${lists.easy.map((s) => scaleItem(s, Boolean(chord))).join('')}`;
  if (state.song.isBlues && !chord) html += '<p class="muted">This looks like a blues song. Play the minor pentatonic or blues scale, starting from the home note, over every chord.</p>';
  $('chord-scales').innerHTML = html;
}

// One note as a little badge, with its number under it.
const badge = (pc, ref, kind) => `<span class="badge badge-${kind}"><b>${noteName(pc, state.flats)}</b><small>${INTERVAL_NAMES[(pc - ref + 12) % 12]}</small></span>`;

function roleAdvice(tone) {
  switch (tone.role) {
    case 'root': return 'Named after this note. Always safe.';
    case 'third': return tone.distance === 4 ? 'Sounds happy. Great place to stop.' : tone.distance === 3 ? 'Sounds sad. Great place to stop.' : 'Unsettled. It wants to move.';
    case 'fifth': return tone.distance === 7 ? 'Steady. Safe to hold.' : 'Tense. Play briefly.';
    case 'seventh': return 'Rich sound. Nice next to the 3rd.';
    case 'bass': return 'Lowest note. Play it when the bass does.';
    default: return 'Extra chord note.';
  }
}

function drawNotes(chord) {
  const scale = state.scale;
  if (!chord) {
    const notes = scale.def.distances.map((d) => (scale.root + d) % 12);
    $('chord-notes').innerHTML = `<h3 class="panel-title">Notes in ${scaleName(scale, state.flats)}</h3>
      <p class="muted">${scale.def.vibe}</p>
      <div class="badge-row">${notes.map((pc, i) => badge(pc, scale.root, i === 0 ? 'root' : 'tone')).join('')}</div>
      <p>Now pick a chord to see the best notes for that chord.</p>`;
    return;
  }
  const order = { root: 0, third: 1, fifth: 2, seventh: 3, color: 4, bass: 5 };
  const tones = [...chord.tones].sort((a, b) => order[a.role] - order[b.role]);
  let html = `<h3 class="panel-title">Notes to play over ${chord.name}</h3><p class="muted">Using ${scaleName(scale, state.flats)}.</p>
    <h4 class="panel-label">Stop on these</h4>
    <div class="advice">${tones.map((t) => `${badge(t.pc, chord.root, t.role === 'root' ? 'root' : 'tone')}<span>${roleAdvice(t)}</span>`).join('')}</div>`;

  const inChord = new Set(chord.tones.map((t) => t.pc));
  const quick = [];
  const move = [];
  for (const d of scale.def.distances) {
    const pc = (scale.root + d) % 12;
    if (inChord.has(pc)) continue;
    (chord.tones.some((t) => (t.pc + 1) % 12 === pc) ? quick : move).push(pc);
  }
  html += '<h4 class="panel-label">Move with these</h4>';
  html += move.length ? `<div class="badge-row">${move.map((pc) => badge(pc, chord.root, 'scale')).join('')}</div><p class="muted">Use them to get between the best notes.</p>` : '<p class="muted">None. All scale notes are chord notes.</p>';
  html += '<h4 class="panel-label">Play these quickly</h4>';
  html += quick.length ? `<div class="badge-row">${quick.map((pc) => badge(pc, chord.root, 'clash')).join('')}</div><p class="muted">They clash a little. Play them briefly.</p>` : '<p class="muted">None. All notes here are safe.</p>';
  const outside = chord.tones.filter((t) => !scale.notes.has(t.pc));
  if (outside.length) html += `<p class="muted">${outside.map((t) => noteName(t.pc, state.flats)).join(', ')} is in the chord but not the scale (dashed ring).</p>`;

  const upward = chord.tones.filter((t) => t.role !== 'bass').sort((a, b) => a.distance - b.distance).map((t) => noteName(t.pc, state.flats));
  let tip = `Try: <b>${upward.join(' → ')}${upward.length > 2 ? ` → ${upward[1]}` : ''}</b>.`;
  if (state.chords.length > 1) {
    const next = state.chords[(state.focus + 1) % state.chords.length];
    const move2 = nextMove(chord, next);
    if (move2.best) tip += ` To reach ${next.name}: play <b>${noteName(move2.best.from, state.flats)}</b>, then <b>${noteName(move2.best.to, state.flats)}</b>.`;
    if (move2.shared.length) tip += ` ${move2.shared.map((pc) => noteName(pc, state.flats)).join(', ')} ${move2.shared.length > 1 ? 'are' : 'is'} in both chords. Keep ${move2.shared.length > 1 ? 'them' : 'it'} going.`;
  }
  $('chord-notes').innerHTML = `${html}<p class="tip">${tip}</p>`;
}

function drawSheet() {
  const names = (chord, roles) => chord.tones.filter((t) => roles.includes(t.role)).map((t) => noteName(t.pc, state.flats)).join(' ') || '–';
  const rows = state.chords.map((chord, i) => {
    let into = '–';
    if (state.chords.length > 1) {
      const m = nextMove(chord, state.chords[(i + 1) % state.chords.length]);
      into = (m.best ? `${noteName(m.best.from, state.flats)} → ${noteName(m.best.to, state.flats)}` : '')
        + (m.shared.length ? `${m.best ? '  ·  ' : ''}keep ${m.shared.map((pc) => noteName(pc, state.flats)).join(' ')}` : '') || '–';
    }
    return `<tr class="sheet-row${state.focus === i ? ' on' : ''}" data-index="${i}"><td class="sheet-chord">${chord.name}</td><td>${names(chord, ['root'])}</td><td>${names(chord, ['third'])}</td><td>${names(chord, ['fifth'])}</td><td>${names(chord, ['seventh', 'color', 'bass'])}</td><td>${into}</td></tr>`;
  }).join('');
  $('chord-sheet').innerHTML = `<h3 class="panel-title">Cheat sheet</h3><p class="muted">Safe notes for each chord. Tap a row to see it.</p>
    <div class="table-scroll"><table class="learn-table"><thead><tr><th>Chord</th><th>Main note</th><th>3rd</th><th>5th</th><th>Extra notes</th><th>Move to next chord</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function draw() {
  const chord = state.focus >= 0 ? state.chords[state.focus] : null;
  state.flats = useFlats(state.chords, state.scale);
  drawChips();
  drawBoard(chord);
  drawScales(chord);
  drawNotes(chord);
  drawSheet();
  $('chord-only').disabled = !chord;
  $('chord-only').closest('label').classList.toggle('off', !chord);
  $('chord-area').max = FRETS - 4;
  $('chord-area-label').textContent = `Frets ${state.areaStart}–${state.areaStart + 4}`;
}

// --- Doing things ---

// Pick a chord (or -1 for All). Keep the same scale if it still fits that chord.
function pickChord(index) {
  state.focus = index;
  if (index >= 0) {
    const chord = state.chords[index];
    const staysBlues = state.song.isBlues && state.scale.root === state.chords[0].root && ['minpent', 'blues'].includes(state.scale.def.id);
    if (!staysBlues && coverage(chord, state.scale.notes) < 0.99) {
      const lists = suggestForChord(chord, state.scale);
      state.scale = lists.best[0] ?? lists.easy[0] ?? state.scale;
    }
  }
  draw();
}

// Read the typed chords and start over with the best scale for the song.
export function loadChords(text) {
  const { chords, unreadable } = parseChords(text);
  state.chords = chords;
  state.unreadable = unreadable;
  $('chord-error').hidden = unreadable.length === 0;
  $('chord-error').textContent = `Could not read: ${unreadable.join(', ')}. Skipped.`;
  $('chord-content').hidden = chords.length === 0;
  $('chord-empty').hidden = chords.length > 0;
  if (!chords.length) return;
  $('chord-input').value = text;
  if (state.focus >= chords.length) state.focus = -1;
  state.song = suggestForSong(chords);
  state.scale = makeScale(state.song.pick.root, state.song.pick.def);
  state.scale.fit = state.song.pick.fit;
  if (state.focus >= 0) pickChord(state.focus);
  else draw();
}

// Wire up the buttons once, when the app starts.
export function initChords() {
  const input = $('chord-input');
  input.addEventListener('input', () => loadChords(input.value));

  $('chord-examples').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    state.focus = -1;
    loadChords(button.textContent);
  });
  $('chord-tabs').addEventListener('click', (event) => {
    const button = event.target.closest('.chip');
    if (!button) return;
    const index = Number(button.dataset.index);
    pickChord(index);
    if (index >= 0) strumChord(state.chords[index]);
  });
  $('chord-sheet').addEventListener('click', (event) => {
    const row = event.target.closest('.sheet-row');
    if (!row) return;
    const index = Number(row.dataset.index);
    pickChord(index);
    strumChord(state.chords[index]);
  });
  $('chord-scales').addEventListener('click', (event) => {
    const item = event.target.closest('.scale-item');
    const picked = item && shownScales[item.dataset.key];
    if (!picked) return;
    state.scale = makeScale(picked.root, picked.def);
    state.scale.fit = picked.fit;
    draw();
    const base = 60 + picked.root;
    [...picked.def.distances, 12].forEach((d, i) => playNote(base + d, i * 0.14, 0.5, 0.12));
  });
  $('chord-board').addEventListener('click', (event) => {
    const dot = event.target.closest('.dot');
    if (dot) playNote(Number(dot.dataset.midi), 0, 1.3, 0.2);
  });

  const segment = (id, onPick) => $(id).addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    for (const b of $(id).children) b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
    onPick(button.dataset.value);
  });
  segment('chord-labels', (value) => { state.numbers = value === 'numbers'; draw(); });
  segment('chord-view', (value) => {
    state.area = value === 'area';
    if (state.area) {
      // Start the area where the home note is on the low E string.
      const chord = state.focus >= 0 ? state.chords[state.focus] : null;
      let fret = ((chord ? chord.root : state.scale.root) - 4 + 12) % 12;
      if (fret < 1) fret += 12;
      state.areaStart = Math.max(0, Math.min(FRETS - 4, fret - 1));
      $('chord-area').value = state.areaStart;
    }
    $('chord-area').hidden = !state.area;
    $('chord-area-label').hidden = !state.area;
    draw();
  });
  $('chord-area').addEventListener('input', (event) => { state.areaStart = Number(event.target.value); draw(); });
  $('chord-only').addEventListener('change', (event) => { state.onlyChordNotes = event.target.checked; draw(); });

  loadChords(input.value);
}
