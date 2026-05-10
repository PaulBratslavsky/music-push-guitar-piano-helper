export type PitchClass =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F'
  | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export const PITCH_CLASSES: PitchClass[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

export type Note = {
  pitchClass: PitchClass;
  octave: number;
};

export type ChordQuality =
  // Triads
  | 'maj' | 'min' | 'dim' | 'aug' | 'sus2' | 'sus4'
  // Sixths
  | '6' | 'm6'
  // Sevenths
  | 'maj7' | 'min7' | 'dom7' | 'm7b5' | 'dim7' | 'mMaj7' | '7sus4'
  // Add chords
  | 'add9' | 'madd9'
  // Ninths
  | '9' | 'maj9' | 'm9'
  // 11ths / 13ths
  | '11' | 'm11' | '13' | 'm13'
  // Altered dominants
  | '7b5' | '7#5' | '7b9' | '7#9' | 'alt';

export const CHORD_QUALITIES: ChordQuality[] = [
  'maj', 'min', 'dim', 'aug', 'sus2', 'sus4',
  '6', 'm6',
  'maj7', 'min7', 'dom7', 'm7b5', 'dim7', 'mMaj7', '7sus4',
  'add9', 'madd9',
  '9', 'maj9', 'm9',
  '11', 'm11', '13', 'm13',
  '7b5', '7#5', '7b9', '7#9', 'alt',
];

export type ChordSelection = {
  root: PitchClass;
  quality: ChordQuality;
  inversion: number;
  voicingIndex: number;
};

export type ScaleType =
  | 'major' | 'minor' | 'harmonicMinor' | 'melodicMinor'
  | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian'
  | 'majorPentatonic' | 'minorPentatonic' | 'blues';

export const SCALE_TYPES: ScaleType[] = [
  'major', 'minor', 'harmonicMinor', 'melodicMinor',
  'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian',
  'majorPentatonic', 'minorPentatonic', 'blues',
];

export type ScaleSelection = {
  root: PitchClass;
  type: ScaleType;
};

/**
 * 'all' = show every scale note across the neck.
 * 1-5 = one of the 5 CAGED shapes (only for major-derived 7-note scales).
 *   Numbering follows guitarscale.org:
 *     1 = E-shape, 2 = D-shape, 3 = C-shape (octave up), 4 = A-shape, 5 = G-shape.
 *   For C major those land at fret 7, 10, 12, 2, 4 respectively.
 */
export type ScalePosition = 'all' | 1 | 2 | 3 | 4 | 5;
export const SCALE_POSITIONS: ScalePosition[] = ['all', 1, 2, 3, 4, 5];

export type ViewMode = 'chord' | 'scale' | 'note' | 'all';

export type AppState = {
  mode: ViewMode;
  chord: ChordSelection;
  scale: ScaleSelection;
  singleNote: PitchClass;
  scalePosition: ScalePosition;
};

export type PianoKey = {
  note: Note;
  isBlack: boolean;
  index: number;
};

export type GuitarPosition = {
  string: number;
  fret: number;
  note: Note;
};

export type PushPad = {
  row: number;
  col: number;
  note: Note;
};

export type ResolvedSelection = {
  piano: Note[];
  guitar: Note[];
  push: Note[];
  rootPitchClass: PitchClass | null;
  label: string;
};
