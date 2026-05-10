import {
  CHORD_QUALITIES,
  PITCH_CLASSES,
  SCALE_POSITIONS,
  SCALE_TYPES,
  type ChordQuality,
  type PitchClass,
  type ScalePosition,
  type ScaleType,
  type ViewMode,
} from '../types';
import { SCALE_TYPE_LABELS } from '../theory/scales';
import { supportsCaged } from '../theory/positions';
import { useAppState } from '../state/useAppState';
import { chordInversionCount, chordVoicingCount } from '../state/resolve';

const QUALITY_DISPLAY: Record<ChordQuality, string> = {
  maj: 'maj',
  min: 'm',
  dim: 'dim',
  aug: 'aug',
  sus2: 'sus2',
  sus4: 'sus4',
  '6': '6',
  m6: 'm6',
  maj7: 'maj7',
  min7: 'm7',
  dom7: '7',
  m7b5: 'm7♭5',
  dim7: 'dim7',
  mMaj7: 'mMaj7',
  '7sus4': '7sus4',
  add9: 'add9',
  madd9: 'm(add9)',
  '9': '9',
  maj9: 'maj9',
  m9: 'm9',
  '11': '11',
  m11: 'm11',
  '13': '13',
  m13: 'm13',
  '7b5': '7♭5',
  '7#5': '7♯5',
  '7b9': '7♭9',
  '7#9': '7♯9',
  alt: 'alt',
};

type Props = ReturnType<typeof useAppState>;

export function SelectionBar({
  state,
  setMode,
  setChord,
  setScale,
  setSingleNote,
  setScalePosition,
  labelMode,
  setLabelMode,
  showNaturals,
  setShowNaturals,
}: Props) {
  const modes: ViewMode[] = ['chord', 'scale', 'note', 'all'];

  return (
    <div className="panel selection-bar">
      <div className="selection-group">
        <span className="group-label">Mode</span>
        <div className="btn-row">
          {modes.map((m) => (
            <button
              key={m}
              className={`chip${state.mode === m ? ' active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'chord' ? 'Chord' : m === 'scale' ? 'Scale' : m === 'note' ? 'Note' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {state.mode !== 'all' && (
      <div className="selection-group">
        <span className="group-label">Root</span>
        <div className="btn-row">
          {PITCH_CLASSES.map((pc) => {
            const active =
              (state.mode === 'chord' && state.chord.root === pc) ||
              (state.mode === 'scale' && state.scale.root === pc) ||
              (state.mode === 'note' && state.singleNote === pc);
            return (
              <button
                key={pc}
                className={`chip${active ? ' active' : ''}`}
                onClick={() => {
                  if (state.mode === 'chord') {
                    setChord((c) => ({ ...c, root: pc as PitchClass, inversion: 0 }));
                  } else if (state.mode === 'scale') {
                    setScale((s) => ({ ...s, root: pc as PitchClass }));
                  } else {
                    setSingleNote(pc as PitchClass);
                  }
                }}
              >
                {pc}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {state.mode === 'chord' && (
        <>
          <div className="selection-group">
            <span className="group-label">Quality</span>
            <div className="btn-row">
              {CHORD_QUALITIES.map((q) => (
                <button
                  key={q}
                  className={`chip${state.chord.quality === q ? ' active' : ''}`}
                  onClick={() =>
                    setChord((c) => ({ ...c, quality: q as ChordQuality, inversion: 0 }))
                  }
                >
                  {QUALITY_DISPLAY[q]}
                </button>
              ))}
            </div>
          </div>

          <div className="selection-group">
            <span className="group-label">Inversion</span>
            <Stepper
              value={state.chord.inversion}
              max={Math.max(0, chordInversionCount(state.chord) - 1)}
              onChange={(n) => setChord((c) => ({ ...c, inversion: n }))}
            />
          </div>

          <div className="selection-group">
            <span className="group-label">Voicing</span>
            <Stepper
              value={state.chord.voicingIndex}
              max={Math.max(0, chordVoicingCount(state.chord) - 1)}
              onChange={(n) => setChord((c) => ({ ...c, voicingIndex: n }))}
            />
          </div>
        </>
      )}

      {state.mode === 'scale' && (
        <>
          <div className="selection-group">
            <span className="group-label">Scale</span>
            <div className="btn-row">
              {SCALE_TYPES.map((t) => (
                <button
                  key={t}
                  className={`chip${state.scale.type === t ? ' active' : ''}`}
                  onClick={() => setScale((s) => ({ ...s, type: t as ScaleType }))}
                >
                  {SCALE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          {supportsCaged(state.scale.type) && (
            <div className="selection-group">
              <span
                className="group-label"
                title="Filter the guitar fretboard to one of the 5 CAGED scale shapes (E, D, C, A, G). Modes share the parent major's shapes."
              >
                Guitar shape
              </span>
              <div className="btn-row">
                {SCALE_POSITIONS.map((p) => (
                  <button
                    key={String(p)}
                    className={`chip${state.scalePosition === p ? ' active' : ''}`}
                    onClick={() => setScalePosition(p as ScalePosition)}
                    title={
                      p === 'all'
                        ? 'Show every scale note across the neck'
                        : `Shape ${p}`
                    }
                  >
                    {p === 'all' ? 'All' : `Shape ${p}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {state.mode !== 'note' && state.mode !== 'all' && (
        <div className="selection-group">
          <span className="group-label">Labels</span>
          <div className="btn-row">
            <button
              className={`chip${labelMode === 'name' ? ' active' : ''}`}
              onClick={() => setLabelMode('name')}
              title="Show note names (C, D, E…)"
            >
              Notes
            </button>
            <button
              className={`chip${labelMode === 'degree' ? ' active' : ''}`}
              onClick={() => setLabelMode('degree')}
              title="Show scale-degree numbers (1, 2, b3…)"
            >
              Degrees
            </button>
          </div>
        </div>
      )}

      <div className="selection-group">
        <span className="group-label">Guitar overlay</span>
        <div className="btn-row">
          <button
            className={`chip${showNaturals ? ' active' : ''}`}
            onClick={() => setShowNaturals(!showNaturals)}
            title="Show all natural notes (C, D, E, F, G, A, B) on the guitar fretboard"
          >
            Naturals
          </button>
        </div>
      </div>
    </div>
  );
}

function Stepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const wrap = (n: number) => {
    if (max <= 0) return 0;
    const span = max + 1;
    return ((n % span) + span) % span;
  };
  return (
    <div className="stepper">
      <button onClick={() => onChange(wrap(value - 1))} aria-label="previous">
        ‹
      </button>
      <span className="stepper-value">{value}</span>
      <button onClick={() => onChange(wrap(value + 1))} aria-label="next">
        ›
      </button>
    </div>
  );
}
