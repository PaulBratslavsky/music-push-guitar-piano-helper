import type { PitchClass, ScalePosition, ScaleType } from '../types';
import { PITCH_CLASSES } from '../types';
import { STANDARD_TUNING_MIDI, FRET_COUNT } from '../instruments/guitar/layout';

export type RealizedPosition = { string: number; fret: number };

/* -------------------------------------------------------------------------- */
/*  CAGED scale-shape data                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Each CAGED shape is stored as a list of (string, fretOffset) where
 * fretOffset is measured from the LOW-E ROOT of the scale (i.e., the fret on
 * the low E string where the scale's tonic sits).
 *
 * Source: standard CAGED major-scale shapes, cross-referenced with
 * https://www.guitarscale.org/c-major.html for shape numbering.
 *
 *   Shape 1 = E-shape   (anchor near low-E root, ~5 frets above the root)
 *   Shape 2 = D-shape   (anchor on D-string root, ~2-5 frets above low-E root)
 *   Shape 3 = C-shape   (anchor on A-string root, octave UP from low-E root)
 *   Shape 4 = A-shape   (anchor on A-string root, lower octave)
 *   Shape 5 = G-shape   (anchor near low-E root, but lower than E-shape)
 *
 * Strings: 0 = high E … 5 = low E.
 *
 * For non-C roots the same offsets are applied (fret = anchor + offset);
 * if any fret falls below 0, the entire shape is shifted up by 12 frets;
 * if any fret exceeds FRET_COUNT, the shape is shifted down by 12.
 */
export type CagedShape = {
  name: string;
  positions: { string: number; fretOffset: number }[];
};

const SHAPE_1_E: CagedShape = {
  name: 'E-shape',
  // For C major (low-E root at fret 8) → frets 7-10
  // low E:  7  8 10  → -1, 0, +2
  // A:      7  8 10  → -1, 0, +2
  // D:      7  9 10  → -1, +1, +2
  // G:      7  9 10  → -1, +1, +2
  // B:      8 10     → 0, +2
  // high E: 7  8 10  → -1, 0, +2
  positions: [
    { string: 5, fretOffset: -1 }, { string: 5, fretOffset: 0 }, { string: 5, fretOffset: 2 },
    { string: 4, fretOffset: -1 }, { string: 4, fretOffset: 0 }, { string: 4, fretOffset: 2 },
    { string: 3, fretOffset: -1 }, { string: 3, fretOffset: 1 }, { string: 3, fretOffset: 2 },
    { string: 2, fretOffset: -1 }, { string: 2, fretOffset: 1 }, { string: 2, fretOffset: 2 },
    { string: 1, fretOffset: 0 },  { string: 1, fretOffset: 2 },
    { string: 0, fretOffset: -1 }, { string: 0, fretOffset: 0 }, { string: 0, fretOffset: 2 },
  ],
};

const SHAPE_2_D: CagedShape = {
  name: 'D-shape',
  // Per guitarscale.org Shape 2 (10th position) for C major → frets 10-14
  // low E:  10 12 13 → +2, +4, +5
  // A:      10 12 14 → +2, +4, +6
  // D:      10 12 14 → +2, +4, +6  (root C at fret 10)
  // G:      10 12    → +2, +4
  // B:      10 12 13 → +2, +4, +5  (root C at fret 13)
  // high E: 10 12 13 → +2, +4, +5
  positions: [
    { string: 5, fretOffset: 2 }, { string: 5, fretOffset: 4 }, { string: 5, fretOffset: 5 },
    { string: 4, fretOffset: 2 }, { string: 4, fretOffset: 4 }, { string: 4, fretOffset: 6 },
    { string: 3, fretOffset: 2 }, { string: 3, fretOffset: 4 }, { string: 3, fretOffset: 6 },
    { string: 2, fretOffset: 2 }, { string: 2, fretOffset: 4 },
    { string: 1, fretOffset: 2 }, { string: 1, fretOffset: 4 }, { string: 1, fretOffset: 5 },
    { string: 0, fretOffset: 2 }, { string: 0, fretOffset: 4 }, { string: 0, fretOffset: 5 },
  ],
};

const SHAPE_3_C: CagedShape = {
  name: 'C-shape',
  // For C major → frets 12-15 (octave up from open C)
  // low E:  12 13 15 → +4, +5, +7
  // A:      12 14 15 → +4, +6, +7
  // D:      12 14 15 → +4, +6, +7
  // G:      12 14    → +4, +6
  // B:      12 13 15 → +4, +5, +7
  // high E: 12 13 15 → +4, +5, +7
  positions: [
    { string: 5, fretOffset: 4 }, { string: 5, fretOffset: 5 }, { string: 5, fretOffset: 7 },
    { string: 4, fretOffset: 4 }, { string: 4, fretOffset: 6 }, { string: 4, fretOffset: 7 },
    { string: 3, fretOffset: 4 }, { string: 3, fretOffset: 6 }, { string: 3, fretOffset: 7 },
    { string: 2, fretOffset: 4 }, { string: 2, fretOffset: 6 },
    { string: 1, fretOffset: 4 }, { string: 1, fretOffset: 5 }, { string: 1, fretOffset: 7 },
    { string: 0, fretOffset: 4 }, { string: 0, fretOffset: 5 }, { string: 0, fretOffset: 7 },
  ],
};

const SHAPE_4_A: CagedShape = {
  name: 'A-shape',
  // Per guitarscale.org Shape 4 (2nd position) for C major → frets 2-6
  // low E:  3 5   → -5, -3
  // A:      2 3 5 → -6, -5, -3  (root C at fret 3)
  // D:      2 3 5 → -6, -5, -3
  // G:      2 4 5 → -6, -4, -3  (root C at fret 5)
  // B:      3 5 6 → -5, -3, -2
  // high E: 3 5   → -5, -3
  positions: [
    { string: 5, fretOffset: -5 }, { string: 5, fretOffset: -3 },
    { string: 4, fretOffset: -6 }, { string: 4, fretOffset: -5 }, { string: 4, fretOffset: -3 },
    { string: 3, fretOffset: -6 }, { string: 3, fretOffset: -5 }, { string: 3, fretOffset: -3 },
    { string: 2, fretOffset: -6 }, { string: 2, fretOffset: -4 }, { string: 2, fretOffset: -3 },
    { string: 1, fretOffset: -5 }, { string: 1, fretOffset: -3 }, { string: 1, fretOffset: -2 },
    { string: 0, fretOffset: -5 }, { string: 0, fretOffset: -3 },
  ],
};

const SHAPE_5_G: CagedShape = {
  name: 'G-shape',
  // Per guitarscale.org Shape 5 (4th position) for C major → frets 4-8
  // low E:  5 7 8 → -3, -1, 0
  // A:      5 7 8 → -3, -1, 0
  // D:      5 7   → -3, -1
  // G:      4 5 7 → -4, -3, -1  (root C at fret 5)
  // B:      5 6 8 → -3, -2,  0
  // high E: 5 7 8 → -3, -1, 0
  positions: [
    { string: 5, fretOffset: -3 }, { string: 5, fretOffset: -1 }, { string: 5, fretOffset: 0 },
    { string: 4, fretOffset: -3 }, { string: 4, fretOffset: -1 }, { string: 4, fretOffset: 0 },
    { string: 3, fretOffset: -3 }, { string: 3, fretOffset: -1 },
    { string: 2, fretOffset: -4 }, { string: 2, fretOffset: -3 }, { string: 2, fretOffset: -1 },
    { string: 1, fretOffset: -3 }, { string: 1, fretOffset: -2 }, { string: 1, fretOffset: 0 },
    { string: 0, fretOffset: -3 }, { string: 0, fretOffset: -1 }, { string: 0, fretOffset: 0 },
  ],
};

const CAGED_SHAPES: Record<Exclude<ScalePosition, 'all'>, CagedShape> = {
  1: SHAPE_1_E,
  2: SHAPE_2_D,
  3: SHAPE_3_C,
  4: SHAPE_4_A,
  5: SHAPE_5_G,
};

/* -------------------------------------------------------------------------- */
/*  Parent-major lookup                                                       */
/* -------------------------------------------------------------------------- */

/**
 * For modes & pentatonics, the CAGED shapes are anchored on the *parent major*
 * tonic. e.g. D Dorian uses C-major shapes (the same notes); A minor pentatonic
 * uses C-major shapes filtered to the pentatonic notes.
 *
 * Returns null for scales without a clean major parent (harmonic minor,
 * melodic minor, blues) — those don't get a position selector.
 */
const PARENT_MAJOR_SEMITONE_OFFSET: Partial<Record<ScaleType, number>> = {
  major: 0,
  dorian: -2,
  phrygian: -4,
  lydian: -5,
  mixolydian: -7,
  minor: -9, // = aeolian
  locrian: -11,
  majorPentatonic: 0,
  minorPentatonic: -9,
};

function transpose(pc: PitchClass, semitones: number): PitchClass {
  const idx = ((PITCH_CLASSES.indexOf(pc) + semitones) % 12 + 12) % 12;
  return PITCH_CLASSES[idx];
}

export function parentMajorRoot(scaleType: ScaleType, scaleRoot: PitchClass): PitchClass | null {
  const offset = PARENT_MAJOR_SEMITONE_OFFSET[scaleType];
  if (offset === undefined) return null;
  return transpose(scaleRoot, offset);
}

export function supportsCaged(scaleType: ScaleType): boolean {
  return PARENT_MAJOR_SEMITONE_OFFSET[scaleType] !== undefined;
}

/* -------------------------------------------------------------------------- */
/*  Realization                                                               */
/* -------------------------------------------------------------------------- */

function lowestFretForPC(stringIdx: number, pc: PitchClass): number {
  const openMidi = STANDARD_TUNING_MIDI[stringIdx];
  const openPcIdx = ((openMidi % 12) + 12) % 12;
  const targetIdx = PITCH_CLASSES.indexOf(pc);
  return ((targetIdx - openPcIdx) % 12 + 12) % 12;
}

/**
 * Realize a CAGED shape for the given parent-major root, then filter to only
 * include positions whose pitch class is in the user's actual scale (so modes
 * and pentatonics emerge from the same major shape).
 *
 * Wrap logic: if any position would fall below fret 0 the whole shape shifts
 * up by 12; if any position would fall above FRET_COUNT it shifts down by 12.
 * Notes still off-neck after one wrap attempt are dropped.
 */
export function realizeCagedShape(
  position: Exclude<ScalePosition, 'all'>,
  parentMajorPc: PitchClass,
  scalePcs: PitchClass[],
): RealizedPosition[] {
  const shape = CAGED_SHAPES[position];
  const anchor = lowestFretForPC(STANDARD_TUNING_MIDI.length - 1, parentMajorPc);

  // First pass: compute raw frets.
  const raw = shape.positions.map((p) => ({
    string: p.string,
    fret: anchor + p.fretOffset,
  }));

  // If any fret <= 0, shift the whole shape up by 12. Note: <= 0, not < 0 —
  // we also shift away from open-string positions because guitarscale.org's
  // convention prefers fingered (non-open) shapes when both octaves fit.
  // Example: F major Shape 1 naturally lands at frets 0-3; we shift to 12-15.
  let minFret = Math.min(...raw.map((p) => p.fret));
  let shifted = raw;
  if (minFret <= 0) {
    shifted = raw.map((p) => ({ ...p, fret: p.fret + 12 }));
  }

  // If any fret > FRET_COUNT, shift down by 12.
  let maxFret = Math.max(...shifted.map((p) => p.fret));
  if (maxFret > FRET_COUNT) {
    shifted = shifted.map((p) => ({ ...p, fret: p.fret - 12 }));
  }

  // Drop anything still off-neck and filter to the scale's pitch classes.
  const scalePcSet = new Set(scalePcs);
  return shifted
    .filter((p) => p.fret >= 0 && p.fret <= FRET_COUNT)
    .filter((p) => {
      const midi = STANDARD_TUNING_MIDI[p.string] + p.fret;
      const pc = PITCH_CLASSES[((midi % 12) + 12) % 12];
      return scalePcSet.has(pc);
    });
}

export function shapeName(position: Exclude<ScalePosition, 'all'>): string {
  return CAGED_SHAPES[position].name;
}
