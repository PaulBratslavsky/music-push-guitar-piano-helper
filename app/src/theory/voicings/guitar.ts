import type { ChordSelection, Note, PitchClass } from '../../types';
import { GUITAR_SHAPES, type GuitarShape } from './guitar-shapes';
import { STANDARD_TUNING_MIDI, FRET_COUNT } from '../../instruments/guitar/layout';
import { midiFromPitchOctave, noteFromMidi } from '../notes';
import { PITCH_CLASSES } from '../../types';
import { getChordPitchClasses } from '../chords';

export type GuitarVoicing = {
  notes: Note[];
  shapeName: string | null;
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
function realizeShape(shape: GuitarShape, root: PitchClass): Note[] | null {
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
  return notes.length > 0 ? notes : null;
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
  const shapes = GUITAR_SHAPES[sel.quality] ?? [];
  const pcs = getChordPitchClasses(sel.root, sel.quality);

  if (shapes.length === 0) {
    return { notes: pitchClassFallback(pcs), shapeName: null };
  }

  const v = ((sel.voicingIndex % shapes.length) + shapes.length) % shapes.length;
  const realized = realizeShape(shapes[v], sel.root);
  if (realized) {
    return { notes: realized, shapeName: shapes[v].name };
  }
  // Try the other shapes as fallback.
  for (let i = 0; i < shapes.length; i++) {
    if (i === v) continue;
    const r = realizeShape(shapes[i], sel.root);
    if (r) return { notes: r, shapeName: shapes[i].name };
  }
  return { notes: pitchClassFallback(pcs), shapeName: null };
}

export function guitarVoicingCount(quality: ChordSelection['quality']): number {
  const shapes = GUITAR_SHAPES[quality] ?? [];
  return Math.max(1, shapes.length);
}

export function guitarHasShape(quality: ChordSelection['quality']): boolean {
  return (GUITAR_SHAPES[quality] ?? []).length > 0;
}
