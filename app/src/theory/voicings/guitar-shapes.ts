import type { ChordQuality } from '../../types';

/**
 * A shape is a movable fingering, defined relative to a "root string".
 *
 * - `rootString` is the string on which the chord's root sits (0 = high E, 5 = low E).
 * - `frets[]` is one entry per string (length 6), in the same indexing.
 *   - A number is the fret offset from the root's fret on the rootString.
 *     For example, an A-shape barre has rootString=4 (A), and the offsets describe
 *     where each other string is fretted relative to the root fret.
 *   - `null` means the string is not played.
 *
 * To realize the shape for a specific root pitch class, we find the lowest fret on
 * the rootString that produces that pitch class (0..11), then offset every other
 * string accordingly. Negative absolute frets shift up by 12 to keep the shape on
 * the fretboard.
 */
export type GuitarShape = {
  name: string;
  rootString: number; // 0 = high E, 5 = low E
  frets: (number | null)[]; // length 6, indexed [highE..lowE]
};

/**
 * Convention for offsets:
 *   Each entry is the fret offset relative to the root fret on `rootString`.
 *   Open shapes use negative offsets so the open string (fret 0) appears when the
 *   root is at fret > 0; we shift things into the visible range at realization time.
 *
 * For MVP we ship two shapes per quality where reasonable, anchored on either the
 * low-E string (E-shape barre) or A string (A-shape barre). These are the
 * "movable barre chord" shapes most guitarists know — they cover all 12 roots.
 */
export const GUITAR_SHAPES: Partial<Record<ChordQuality, GuitarShape[]>> = {
  // Major
  maj: [
    // E-shape barre: root on low E. Frets [highE,B,G,D,A,E]
    {
      name: 'E-shape barre',
      rootString: 5,
      frets: [0, 0, 1, 2, 2, 0],
    },
    // A-shape barre: root on A. Open A-shape positions: x 0 2 2 2 0 → relative to root on A
    {
      name: 'A-shape barre',
      rootString: 4,
      frets: [0, 2, 2, 2, 0, null],
    },
  ],
  // Minor
  min: [
    // Em-shape barre: root on low E
    {
      name: 'Em-shape barre',
      rootString: 5,
      frets: [0, 0, 0, 2, 2, 0],
    },
    // Am-shape barre: root on A. Am open: x 0 2 2 1 0
    {
      name: 'Am-shape barre',
      rootString: 4,
      frets: [0, 1, 2, 2, 0, null],
    },
  ],
  // Dominant 7
  dom7: [
    // E7-shape barre: root on low E. E7 open: 0 2 0 1 2 0  (high→low: 0,0,1,0,2,0)
    {
      name: 'E7-shape barre',
      rootString: 5,
      frets: [0, 0, 1, 0, 2, 0],
    },
    // A7-shape barre: root on A. A7 open: x 0 2 0 2 0 → relative
    {
      name: 'A7-shape barre',
      rootString: 4,
      frets: [0, 2, 0, 2, 0, null],
    },
  ],
  // Major 7
  maj7: [
    // Emaj7-shape: 0,4,1,1,2,0 (Emaj7 open) → high→low: 0,0,1,1,2,0
    {
      name: 'Emaj7-shape barre',
      rootString: 5,
      frets: [0, 0, 1, 1, 2, 0],
    },
    // Amaj7-shape: x 0 2 1 2 0 → high→low: 0,2,1,2,0,null
    {
      name: 'Amaj7-shape barre',
      rootString: 4,
      frets: [0, 2, 1, 2, 0, null],
    },
  ],
  // Minor 7
  min7: [
    // Em7-shape: 0,2,0,0,2,0 → high→low: 0,0,0,0,2,0
    {
      name: 'Em7-shape barre',
      rootString: 5,
      frets: [0, 0, 0, 0, 2, 0],
    },
    // Am7-shape: x 0 2 0 1 0 → high→low: 0,1,0,2,0,null
    {
      name: 'Am7-shape barre',
      rootString: 4,
      frets: [0, 1, 0, 2, 0, null],
    },
  ],
  // Diminished triad on D-string root. Intervals: 1, b3, b5 → uses top 4 strings.
  // Verified: for C dim (root=C on D string fret 10), produces C/Eb/Gb.
  dim: [
    {
      name: 'D-string dim triad',
      rootString: 3,
      frets: [null, -3, -2, 0, null, null],
    },
  ],
  // Augmented triad on D-string root. Intervals: 1, 3, #5, R+oct on top 4 strings.
  // Verified: for C aug (root=C on D string fret 10), produces C/E/G#/C.
  aug: [
    {
      name: 'D-string aug triad',
      rootString: 3,
      frets: [-2, -1, -1, 0, null, null],
    },
  ],
  sus2: [
    // sus2: root, 2, 5. Asus2: x 0 2 2 0 0 → high→low: 0,0,2,2,0,null
    {
      name: 'A-shape sus2',
      rootString: 4,
      frets: [0, 0, 2, 2, 0, null],
    },
  ],
  sus4: [
    // sus4: root, 4, 5. Asus4: x 0 2 2 3 0 → high→low: 0,3,2,2,0,null
    {
      name: 'A-shape sus4',
      rootString: 4,
      frets: [0, 3, 2, 2, 0, null],
    },
  ],
};
