import { useCallback, useEffect, useState } from 'react';
import { synth } from '../audio/synth';
import {
  PITCH_CLASSES,
  CHORD_QUALITIES,
  SCALE_TYPES,
  type AppState,
  type ChordQuality,
  type ChordSelection,
  type PitchClass,
  type ScalePosition,
  type ScaleSelection,
  type ScaleType,
  type ViewMode,
} from '../types';

const DEFAULT_STATE: AppState = {
  mode: 'chord',
  chord: { root: 'C', quality: 'maj', inversion: 0, voicingIndex: 0 },
  scale: { root: 'C', type: 'major' },
  singleNote: 'C',
  scalePosition: 'all',
};

function parseScalePosition(s: string | null): ScalePosition {
  if (s === '1' || s === '2' || s === '3' || s === '4' || s === '5' || s === '6' || s === '7') {
    return Number(s) as ScalePosition;
  }
  return 'all';
}

function isPitchClass(s: string | null): s is PitchClass {
  return s != null && (PITCH_CLASSES as readonly string[]).includes(s);
}
function isChordQuality(s: string | null): s is ChordQuality {
  return s != null && (CHORD_QUALITIES as readonly string[]).includes(s);
}
function isScaleType(s: string | null): s is ScaleType {
  return s != null && (SCALE_TYPES as readonly string[]).includes(s);
}
function isViewMode(s: string | null): s is ViewMode {
  return s === 'chord' || s === 'scale' || s === 'note' || s === 'all';
}

function parseIntSafe(s: string | null, fallback: number): number {
  if (s == null) return fallback;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function stateFromUrl(search: string): AppState {
  const params = new URLSearchParams(search);
  const mode = isViewMode(params.get('mode')) ? (params.get('mode') as ViewMode) : DEFAULT_STATE.mode;

  const chordRoot = isPitchClass(params.get('root')) ? (params.get('root') as PitchClass) : DEFAULT_STATE.chord.root;
  const quality = isChordQuality(params.get('quality')) ? (params.get('quality') as ChordQuality) : DEFAULT_STATE.chord.quality;
  const inversion = parseIntSafe(params.get('inv'), DEFAULT_STATE.chord.inversion);
  const voicingIndex = parseIntSafe(params.get('v'), DEFAULT_STATE.chord.voicingIndex);

  const scaleRoot = isPitchClass(params.get('root')) ? (params.get('root') as PitchClass) : DEFAULT_STATE.scale.root;
  const scaleType = isScaleType(params.get('type')) ? (params.get('type') as ScaleType) : DEFAULT_STATE.scale.type;

  const singleNote = isPitchClass(params.get('note')) ? (params.get('note') as PitchClass) : DEFAULT_STATE.singleNote;
  const scalePosition = parseScalePosition(params.get('pos'));

  return {
    mode,
    chord: { root: chordRoot, quality, inversion, voicingIndex },
    scale: { root: scaleRoot, type: scaleType },
    singleNote,
    scalePosition,
  };
}

export function urlFromState(state: AppState): string {
  const params = new URLSearchParams();
  params.set('mode', state.mode);
  if (state.mode === 'chord') {
    params.set('root', state.chord.root);
    params.set('quality', state.chord.quality);
    params.set('inv', String(state.chord.inversion));
    params.set('v', String(state.chord.voicingIndex));
  } else if (state.mode === 'scale') {
    params.set('root', state.scale.root);
    params.set('type', state.scale.type);
    if (state.scalePosition !== 'all') {
      params.set('pos', String(state.scalePosition));
    }
  } else {
    params.set('note', state.singleNote);
  }
  return `?${params.toString()}`;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() =>
    stateFromUrl(typeof window !== 'undefined' ? window.location.search : ''),
  );
  const [focusedPitchClass, setFocusedPitchClassRaw] = useState<PitchClass | null>(null);
  const [labelMode, setLabelMode] = useState<'name' | 'degree'>('name');
  const [showNaturals, setShowNaturals] = useState(false);
  const [audioMuted, setAudioMutedRaw] = useState(false);
  /** When in scale mode, lets the user "preview" a diatonic chord by lighting up
   *  its notes within the scale. null = nothing previewed. Value = scale degree (1..7). */
  const [previewedChordDegree, setPreviewedChordDegreeRaw] = useState<number | null>(null);

  /** Toggle a diatonic-chord preview in scale mode. Same degree clears it. */
  const togglePreviewedChordDegree = useCallback((degree: number) => {
    setPreviewedChordDegreeRaw((prev) => (prev === degree ? null : degree));
  }, []);

  const clearPreviewedChordDegree = useCallback(() => {
    setPreviewedChordDegreeRaw(null);
  }, []);

  const setAudioMuted = useCallback((muted: boolean) => {
    setAudioMutedRaw(muted);
    synth.setMuted(muted);
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioMutedRaw((m) => {
      synth.setMuted(!m);
      return !m;
    });
  }, []);

  // Push to URL whenever state changes
  useEffect(() => {
    const next = urlFromState(state);
    if (window.location.search !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [state]);

  // Listen for back/forward
  useEffect(() => {
    const onPop = () => setState(stateFromUrl(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setMode = useCallback((mode: ViewMode) => {
    setState((s) => ({ ...s, mode }));
    if (mode !== 'scale') setPreviewedChordDegreeRaw(null);
  }, []);

  const setChord = useCallback((updater: (c: ChordSelection) => ChordSelection) => {
    setState((s) => ({ ...s, chord: updater(s.chord) }));
  }, []);

  const setScale = useCallback((updater: (sc: ScaleSelection) => ScaleSelection) => {
    setState((s) => ({ ...s, scale: updater(s.scale) }));
    setPreviewedChordDegreeRaw(null);
  }, []);

  const setSingleNote = useCallback((pc: PitchClass) => {
    setState((s) => ({ ...s, singleNote: pc }));
  }, []);

  /** Switch to chord mode with a specific root + quality (used by the diatonic-chord chips). */
  const selectChord = useCallback((root: PitchClass, quality: ChordQuality) => {
    setState((s) => ({
      ...s,
      mode: 'chord',
      chord: { root, quality, inversion: 0, voicingIndex: 0 },
    }));
  }, []);

  /** Switch to scale mode with a specific root + type (used by the containing-scale chips). */
  const selectScale = useCallback((root: PitchClass, type: ScaleType) => {
    setState((s) => ({
      ...s,
      mode: 'scale',
      scale: { root, type },
    }));
    setPreviewedChordDegreeRaw(null);
  }, []);

  const setScalePosition = useCallback((pos: ScalePosition) => {
    setState((s) => ({ ...s, scalePosition: pos }));
  }, []);

  /** Click-to-focus: clicking the same PC clears the focus. */
  const toggleFocusedPitchClass = useCallback((pc: PitchClass) => {
    setFocusedPitchClassRaw((cur) => (cur === pc ? null : pc));
  }, []);

  const clearFocusedPitchClass = useCallback(() => {
    setFocusedPitchClassRaw(null);
  }, []);

  return {
    state,
    setMode,
    setChord,
    setScale,
    setSingleNote,
    selectChord,
    selectScale,
    setScalePosition,
    focusedPitchClass,
    toggleFocusedPitchClass,
    clearFocusedPitchClass,
    labelMode,
    setLabelMode,
    showNaturals,
    setShowNaturals,
    previewedChordDegree,
    togglePreviewedChordDegree,
    clearPreviewedChordDegree,
    audioMuted,
    setAudioMuted,
    toggleAudio,
  };
}
