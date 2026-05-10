import { Scale } from 'tonal';
import type { PitchClass, ScaleSelection, ScaleType } from '../types';
import { pitchClassFromName } from './notes';

const SCALE_TYPE_TO_TONAL_NAME: Record<ScaleType, string> = {
  major: 'major',
  minor: 'minor',
  harmonicMinor: 'harmonic minor',
  melodicMinor: 'melodic minor',
  dorian: 'dorian',
  phrygian: 'phrygian',
  lydian: 'lydian',
  mixolydian: 'mixolydian',
  locrian: 'locrian',
  majorPentatonic: 'major pentatonic',
  minorPentatonic: 'minor pentatonic',
  blues: 'blues',
};

export const SCALE_TYPE_LABELS: Record<ScaleType, string> = {
  major: 'Major',
  minor: 'Minor',
  harmonicMinor: 'Harm. Minor',
  melodicMinor: 'Mel. Minor',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  mixolydian: 'Mixolydian',
  locrian: 'Locrian',
  majorPentatonic: 'Maj. Pent.',
  minorPentatonic: 'Min. Pent.',
  blues: 'Blues',
};

export function scaleTonalName(root: PitchClass, type: ScaleType): string {
  return `${root} ${SCALE_TYPE_TO_TONAL_NAME[type]}`;
}

export function getScalePitchClasses(selection: ScaleSelection): PitchClass[] {
  const s = Scale.get(scaleTonalName(selection.root, selection.type));
  if (s.empty) return [];
  const result: PitchClass[] = [];
  for (const noteName of s.notes) {
    const pc = pitchClassFromName(noteName);
    if (pc) result.push(pc);
  }
  return result;
}

/** Raw tonal-style note names for the scale (e.g. ['F','G','A','Bb','C','D','E']). */
export function getScaleNoteNames(selection: ScaleSelection): string[] {
  const s = Scale.get(scaleTonalName(selection.root, selection.type));
  return s.empty ? [] : s.notes;
}
