import type { ChordSelection, Note, PitchClass } from '../../types';
import {
  GUITAR_SHAPES,
  OPEN_CHORD_SHAPES,
  type GuitarShape,
  type OpenChordShape,
} from './guitar-shapes';
import { STANDARD_TUNING_MIDI, FRET_COUNT } from '../../instruments/guitar/layout';
import { midiFromPitchOctave, noteFromMidi } from '../notes';
import { PITCH_CLASSES } from '../../types';
import { getChordPitchClasses } from '../chords';

export type GuitarVoicing = {
  notes: Note[];
  shapeName: string | null;
  /**
   * Resolved barre — the absolute fret + string range the index finger
   * should bar. Set only when the realized voicing's shape carries a
   * `barre` annotation AND the resolved barre fret is > 0 (no need to
   * render a bar at the nut). Drives the translucent bar overlay in
   * GuitarView.
   *
   * null for open chords, power chords, and quality fallbacks.
   */
  barre: { fret: number; fromString: number; toString: number } | null;
};

/** Lowest fret (>=0) on `stringIdx` whose note has the given pitch class. */
function lowestFretForPC(stringIdx: number, pc: PitchClass): number {
  const openMidi = STANDARD_TUNING_MIDI[stringIdx];
  const openPcIdx = ((openMidi % 12) + 12) % 12;
  const targetIdx = PITCH_CLASSES.indexOf(pc);
  return ((targetIdx - openPcIdx) % 12 + 12) % 12;
}

/**
 * Realize a shape for a given root pitch class. Returns a list of `Note`s, one per
 * played string. If a fingering would fall off the visible fretboard (fret > FRET_COUNT
 * or fret < 0), shifts the offending position by 12 frets to bring it in range; if
 * still off, drops it. Returns null if no notes survive.
 */
function realizeShape(
  shape: GuitarShape,
  root: PitchClass,
): {
  notes: Note[];
  barre: { fret: number; fromString: number; toString: number } | null;
} | null {
  const rootFret = lowestFretForPC(shape.rootString, root);
  const notes: Note[] = [];
  for (let s = 0; s < shape.frets.length; s++) {
    const offset = shape.frets[s];
    if (offset == null) continue;
    let fret = rootFret + offset;
    while (fret < 0) fret += 12;
    while (fret > FRET_COUNT) fret -= 12;
    if (fret < 0 || fret > FRET_COUNT) continue;
    const midi = STANDARD_TUNING_MIDI[s] + fret;
    notes.push(noteFromMidi(midi));
  }
  if (notes.length === 0) return null;
  // Resolve the barre. Skip rendering when the barre lands at fret 0
  // (the nut already covers open strings — drawing a bar there is noise).
  let barre: { fret: number; fromString: number; toString: number } | null = null;
  if (shape.barre) {
    const barreFret = rootFret + shape.barre.offsetFromRoot;
    if (barreFret > 0 && barreFret <= FRET_COUNT) {
      barre = {
        fret: barreFret,
        fromString: shape.barre.fromString,
        toString: shape.barre.toString,
      };
    }
  }
  return { notes, barre };
}

/**
 * Realize an open-position shape: its frets are absolute (0 = open string),
 * so we just add each played string's fret to that string's open MIDI.
 */
function realizeOpenShape(shape: OpenChordShape): Note[] {
  const notes: Note[] = [];
  for (let s = 0; s < shape.frets.length; s++) {
    const fret = shape.frets[s];
    if (fret == null) continue;
    notes.push(noteFromMidi(STANDARD_TUNING_MIDI[s] + fret));
  }
  return notes;
}

/** Open-position shape for this exact root+quality, or null if there isn't one. */
function openShapeFor(sel: ChordSelection): OpenChordShape | null {
  return OPEN_CHORD_SHAPES[sel.quality]?.[sel.root] ?? null;
}

/**
 * Fallback when no shape is available for a quality (or all shapes fail to realize):
 * return one Note per pitch class at the lowest fretboard position. The GuitarView
 * will end up flooding all positions because we'll pass matchByPitchClass=true at
 * the call site, but for type-correctness we still return concrete notes here.
 */
function pitchClassFallback(pcs: PitchClass[]): Note[] {
  return pcs.map((pc) => noteFromMidi(midiFromPitchOctave(pc, 3)));
}

export function guitarVoicing(sel: ChordSelection): GuitarVoicing {
  const pcs = getChordPitchClasses(sel.root, sel.quality);

  // Ordered voicing list: the open-position fingering (when this exact
  // root+quality has one) comes first so it's the default, followed by the
  // movable barre shapes for the quality. `voicingIndex` selects among them.
  const voicings: GuitarVoicing[] = [];

  const open = openShapeFor(sel);
  if (open) {
    // Open shapes don't barre — they're played with discrete fingers.
    voicings.push({ notes: realizeOpenShape(open), shapeName: open.name, barre: null });
  }

  for (const shape of GUITAR_SHAPES[sel.quality] ?? []) {
    const realized = realizeShape(shape, sel.root);
    if (realized)
      voicings.push({
        notes: realized.notes,
        shapeName: shape.name,
        barre: realized.barre,
      });
  }

  if (voicings.length === 0) {
    return { notes: pitchClassFallback(pcs), shapeName: null, barre: null };
  }

  const v = ((sel.voicingIndex % voicings.length) + voicings.length) % voicings.length;
  return voicings[v];
}

export function guitarVoicingCount(sel: ChordSelection): number {
  let n = (GUITAR_SHAPES[sel.quality] ?? []).length;
  if (openShapeFor(sel)) n += 1;
  return Math.max(1, n);
}

export function guitarHasShape(quality: ChordSelection['quality']): boolean {
  return (GUITAR_SHAPES[quality] ?? []).length > 0;
}

/**
 * Does this quality have any movable named shape OR any root-specific
 * open shape? Used by the SelectionBar Quality picker to dim chips whose
 * qualities will fall back to the pitch-class-flood path (every matching
 * fretboard position lights up — not a named voicing).
 */
export function qualityHasAnyShape(quality: ChordSelection['quality']): boolean {
  if ((GUITAR_SHAPES[quality] ?? []).length > 0) return true;
  const openByRoot = OPEN_CHORD_SHAPES[quality];
  if (!openByRoot) return false;
  return Object.keys(openByRoot).length > 0;
}

/**
 * First voicing index whose shape is annotated as a barre. Returns -1
 * when the quality has no barre voicings (e.g. dim, aug, sus2, sus4, or
 * power chord '5'). Order matches `guitarVoicing`: index 0 is the open
 * shape (if any) for this exact root+quality; movable shapes follow.
 */
export function firstBarreVoicingIndex(sel: ChordSelection): number {
  const hasOpen = openShapeFor(sel) != null;
  const shapes = GUITAR_SHAPES[sel.quality] ?? [];
  const base = hasOpen ? 1 : 0;
  for (let i = 0; i < shapes.length; i++) {
    if (shapes[i].barre) return base + i;
  }
  return -1;
}

/** Shape name of the voicing currently selected by `voicingIndex`, or
 *  null when no shape is defined for this quality. Drives the active
 *  shape-name badge next to the SelectionBar's Voicing stepper. */
export function currentGuitarShapeName(sel: ChordSelection): string | null {
  return guitarVoicing(sel).shapeName;
}
