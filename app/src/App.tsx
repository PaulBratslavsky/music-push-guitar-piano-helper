import { useMemo } from 'react';
import { PianoView } from './instruments/piano/PianoView';
import { GuitarView } from './instruments/guitar/GuitarView';
import { PushView } from './instruments/push/PushView';
import { SelectionBar } from './components/SelectionBar';
import { useAppState } from './state/useAppState';
import { resolveSelection } from './state/resolve';
import { getDiatonicChords } from './theory/diatonic';
import { findScalesContaining } from './theory/chord-scales';
import { synth } from './audio/synth';
import { midiFromNote } from './theory/notes';
import { SheetMusicView } from './instruments/notation/SheetMusicView';
import { TabView } from './instruments/notation/TabView';

export default function App() {
  const appState = useAppState();
  const resolved = useMemo(
    () => resolveSelection(appState.state, appState.previewedChordDegree),
    [appState.state, appState.previewedChordDegree],
  );

  const pcLabels =
    appState.labelMode === 'degree'
      ? resolved.pcDegrees
      : resolved.pcDisplay;

  const focusedNoteName = appState.focusedPitchClass
    ? resolved.pcDisplay[appState.focusedPitchClass] ?? appState.focusedPitchClass
    : null;

  const diatonicChords = useMemo(
    () =>
      appState.state.mode === 'scale'
        ? getDiatonicChords(appState.state.scale)
        : [],
    [appState.state.mode, appState.state.scale],
  );

  const containingScales = useMemo(
    () =>
      appState.state.mode === 'chord'
        ? findScalesContaining(appState.state.chord)
        : [],
    [appState.state.mode, appState.state.chord],
  );

  const playCurrent = () => {
    if (resolved.previewedChordPCs && appState.state.mode === 'scale') {
      // Play the previewed triad as a chord.
      const midis = resolved.piano
        .filter((n) => resolved.previewedChordPCs!.has(n.pitchClass))
        .map(midiFromNote);
      if (midis.length > 0) synth.playChord(midis);
      return;
    }
    if (appState.state.mode === 'chord') {
      synth.playChord(resolved.piano.map(midiFromNote));
    } else {
      // Scale or note mode → play sequence of unique-PC notes ascending.
      const seen = new Set<string>();
      const midis = resolved.piano
        .filter((n) => {
          if (seen.has(n.pitchClass)) return false;
          seen.add(n.pitchClass);
          return true;
        })
        .map(midiFromNote)
        .sort((a, b) => a - b);
      synth.playSequence(midis);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>TriadView</h1>
        <span className="tagline">
          For Push producers learning piano &amp; guitar — see the same chord, scale,
          or note on all three instruments at once.
        </span>
        <button
          type="button"
          className="chip"
          onClick={appState.toggleAudio}
          title={appState.audioMuted ? 'Unmute audio' : 'Mute audio'}
          style={{ marginLeft: 'auto' }}
        >
          {appState.audioMuted ? '🔇 muted' : '🔊 sound'}
        </button>
      </header>

      <SelectionBar {...appState} />

      <div className="panel label-row">
        <button
          type="button"
          className="chip play-chip"
          onClick={playCurrent}
          title="Play the current chord/scale/note"
        >
          ▶
        </button>
        <span className="label">{resolved.label}</span>
        {focusedNoteName && (
          <span className="label focus-label">
            Focused: {focusedNoteName}
            <button
              className="clear-focus"
              onClick={appState.clearFocusedPitchClass}
              aria-label="Clear focused note"
              title="Clear focused note"
            >
              ×
            </button>
          </span>
        )}
        <span className="hint">
          tip: click a key, fret, or pad to focus a note across all three views.
        </span>
      </div>

      {diatonicChords.length > 0 && (
        <div className="panel diatonic-panel">
          <h2 className="panel-title">
            Chords in this scale
            {appState.previewedChordDegree != null && (
              <button
                type="button"
                className="clear-focus"
                style={{ marginLeft: 12 }}
                onClick={appState.clearPreviewedChordDegree}
                title="Clear chord preview"
              >
                ×
              </button>
            )}
          </h2>
          <div className="diatonic-row">
            {diatonicChords.map((c) => {
              const active = appState.previewedChordDegree === c.degree;
              return (
                <button
                  key={c.degree}
                  type="button"
                  className={`diatonic-chip${active ? ' diatonic-chip-active' : ''}`}
                  onClick={() => appState.togglePreviewedChordDegree(c.degree)}
                  title={`Highlight ${c.chordName} within the scale`}
                >
                  <span className="diatonic-roman">{c.roman}</span>
                  <span className="diatonic-name">{c.chordName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {containingScales.length > 0 && (
        <div className="panel diatonic-panel">
          <h2 className="panel-title">Scales containing this chord</h2>
          <div className="diatonic-row">
            {containingScales.slice(0, 12).map((s) => (
              <button
                key={`${s.selection.root}-${s.selection.type}`}
                type="button"
                className="diatonic-chip"
                onClick={() => appState.selectScale(s.selection.root, s.selection.type)}
                title={`Open ${s.label} in scale view`}
              >
                <span className="diatonic-roman">scale</span>
                <span className="diatonic-name">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="instruments">
        <div className="panel">
          <h2 className="panel-title">Piano</h2>
          <PianoView
            highlighted={resolved.piano}
            rootPitchClass={resolved.rootPitchClass}
            matchByPitchClass={resolved.pianoMatchByPitchClass}
            focusedPitchClass={appState.focusedPitchClass}
            onPickPitchClass={appState.toggleFocusedPitchClass}
            onPlayNote={(midi) => synth.playNote(midi)}
            pcLabels={pcLabels}
            emphasizedPitchClasses={resolved.previewedChordPCs}
          />
        </div>
        <div className="panel">
          <h2 className="panel-title">Guitar (standard tuning)</h2>
          <GuitarView
            highlighted={resolved.guitar}
            rootPitchClass={resolved.rootPitchClass}
            matchByPitchClass={resolved.guitarMatchByPitchClass}
            focusedPitchClass={appState.focusedPitchClass}
            onPickPitchClass={appState.toggleFocusedPitchClass}
            onPlayNote={(midi) => synth.playNote(midi)}
            pcLabels={pcLabels}
            shapePositions={resolved.guitarShapePositions}
            showNaturals={appState.showNaturals}
            emphasizedPitchClasses={resolved.previewedChordPCs}
          />
        </div>
        <div className="panel">
          <h2 className="panel-title">Ableton Push (chromatic)</h2>
          <PushView
            highlighted={resolved.push}
            rootPitchClass={resolved.rootPitchClass}
            focusedPitchClass={appState.focusedPitchClass}
            onPickPitchClass={appState.toggleFocusedPitchClass}
            onPlayNote={(midi) => synth.playNote(midi)}
            pcLabels={pcLabels}
            emphasizedPitchClasses={resolved.previewedChordPCs}
          />
        </div>
      </div>

      <div className="notation-row">
        <div className="panel notation-panel">
          <h2 className="panel-title">Sheet music</h2>
          <div className="notation-strip">
            <SheetMusicView
              notes={resolved.piano}
              pcDisplay={resolved.pcDisplay}
              mode={
                appState.state.mode === 'chord'
                  ? 'stack'
                  : appState.state.mode === 'note'
                  ? 'single'
                  : 'sequence'
              }
            />
          </div>
        </div>
        <div className="panel notation-panel">
          <h2 className="panel-title">Guitar tab</h2>
          <div className="notation-strip">
            <TabView
              notes={appState.state.mode === 'chord' ? resolved.guitar : resolved.piano}
              pcDisplay={resolved.pcDisplay}
              mode={
                appState.state.mode === 'chord'
                  ? 'stack'
                  : appState.state.mode === 'note'
                  ? 'single'
                  : 'sequence'
              }
            />
          </div>
        </div>
      </div>

      <footer className="app-footer">
        Guitar CAGED scale shapes adapted from{' '}
        <a href="https://www.guitarscale.org/" target="_blank" rel="noopener noreferrer">
          guitarscale.org
        </a>
        .
      </footer>
    </div>
  );
}
