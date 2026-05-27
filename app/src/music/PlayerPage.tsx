// Player page — the practice-along surface for a saved YouTube video.
//
// Layout: big embed + LoopControls on the left; tabbed right column
// flips between Loops (named saved-section list + Save button) and
// Wheel (Circle of Fifths). Clicking a saved loop hydrates the player
// via the same `?loopId=` convention as music-kb — except here it's
// hash-based: navigate to #/video/<id> with the loop id selected by
// state (no URL bar entry for individual loops since we already store
// the selection in-page).

import { useEffect, useState } from 'react';
import { PlayerProvider, YouTubePlayer, usePlayerControl } from './Player';
import { LoopControls } from './LoopControls';
import { CircleOfFifths } from './CircleOfFifths';
import {
  addLoop,
  deleteLoop,
  getVideo,
  loopsForVideo,
  updateVideo,
} from './storage';
import { navigate } from './useHashRoute';
import type { SavedLoop, SavedVideo } from './types';

export function PlayerPage({ videoId }: { videoId: string }) {
  const video = getVideo(videoId);
  if (!video) {
    return (
      <main
        className="panel"
        style={{ padding: 40, maxWidth: 600, margin: '40px auto', textAlign: 'center' }}
      >
        <h1 style={{ marginTop: 0 }}>Video not found</h1>
        <p style={{ color: 'var(--text-dim)' }}>
          The saved video for id <code>{videoId}</code> isn't in your library.
        </p>
        <button
          type="button"
          className="chip active"
          onClick={() => navigate({ kind: 'library' })}
        >
          Back to music
        </button>
      </main>
    );
  }
  return (
    <PlayerProvider>
      <PlayerInner video={video} />
    </PlayerProvider>
  );
}

type SideTab = 'loops' | 'wheel';

function PlayerInner({ video }: { video: SavedVideo }) {
  const [loops, setLoops] = useState<SavedLoop[]>(() => loopsForVideo(video.id));
  const [sideTab, setSideTab] = useState<SideTab>('loops');
  const [editingTitle, setEditingTitle] = useState(!video.title);
  const [titleDraft, setTitleDraft] = useState(video.title);

  const refresh = () => setLoops(loopsForVideo(video.id));

  return (
    <main
      style={{
        width: '100%',
        padding: '8px 0 40px',
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => navigate({ kind: 'library' })}
          style={{
            all: 'unset',
            cursor: 'pointer',
            color: 'var(--text-dim)',
            fontSize: 13,
          }}
        >
          ← Back to music
        </button>
        {editingTitle ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = titleDraft.trim();
              if (trimmed) updateVideo(video.id, { title: trimmed });
              setEditingTitle(false);
            }}
            style={{ marginTop: 6, display: 'flex', gap: 8 }}
          >
            <input
              type="text"
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder="Title (e.g. Radiohead — Creep)"
              style={{
                flex: 1,
                fontSize: 22,
                fontWeight: 700,
                padding: '4px 8px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--panel-2)',
                color: 'var(--text)',
                fontFamily: 'inherit',
              }}
            />
            <button type="submit" className="chip active" style={{ padding: '4px 12px' }}>
              Save
            </button>
          </form>
        ) : (
          <h1
            style={{
              marginTop: 6,
              fontSize: 24,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={() => {
              setTitleDraft(video.title);
              setEditingTitle(true);
            }}
            title="Click to edit"
          >
            {video.title || '(Untitled — click to edit)'}
          </h1>
        )}
        {video.author && (
          <p style={{ margin: '2px 0 0', color: 'var(--text-dim)', fontSize: 13 }}>
            {video.author}
          </p>
        )}
      </header>

      <div
        style={{
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)',
          alignItems: 'stretch',
        }}
      >
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              overflow: 'hidden',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: '#000',
            }}
          >
            <div style={{ position: 'relative', aspectRatio: '16 / 9', width: '100%' }}>
              <YouTubePlayer
                videoId={video.youtubeVideoId}
                className="player-iframe"
              />
              <style>{`
                .player-iframe, .player-iframe iframe {
                  position: absolute;
                  inset: 0;
                  width: 100%;
                  height: 100%;
                }
              `}</style>
            </div>
            <LoopControls />
          </div>
        </section>

        <aside
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'var(--panel)',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: '8px 8px 0',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: 4,
              flexShrink: 0,
            }}
          >
            <TabButton
              active={sideTab === 'loops'}
              onClick={() => setSideTab('loops')}
            >
              Loops
            </TabButton>
            <TabButton
              active={sideTab === 'wheel'}
              onClick={() => setSideTab('wheel')}
            >
              Wheel
            </TabButton>
          </div>
          {/* Scroll the content area if it overflows the matched-height
              left column (esp. when the wheel SVG + toggles are taller
              than the video). Keeps the panel height locked to the
              video's height instead of pushing the page taller. */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {sideTab === 'loops' ? (
              <LoopsPanel
                videoId={video.id}
                loops={loops}
                onSaved={refresh}
                onDeleted={refresh}
              />
            ) : (
              <div style={{ padding: 12 }}>
                <CircleOfFifths
                  showDirectionToggle={false}
                  showEnharmonicToggle={false}
                />
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        padding: '8px 14px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        color: active ? 'var(--text)' : 'var(--text-dim)',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}

function LoopsPanel({
  videoId,
  loops,
  onSaved,
  onDeleted,
}: {
  videoId: string;
  loops: SavedLoop[];
  onSaved: () => void;
  onDeleted: () => void;
}) {
  return (
    <div style={{ padding: 12 }}>
      <SaveLoopRow videoId={videoId} onSaved={onSaved} />
      {loops.length === 0 ? (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}>
          Mark a section with the A / B buttons under the player, then
          click Save loop to keep it.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {loops.map((l) => (
            <LoopRow
              key={l.id}
              loop={l}
              onDeleted={() => {
                deleteLoop(l.id);
                onDeleted();
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function fmt(sec: number): string {
  const t = Math.max(0, Math.floor(sec));
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`;
}

function LoopRow({
  loop,
  onDeleted,
}: {
  loop: SavedLoop;
  onDeleted: () => void;
}) {
  const { setLoopStart, setLoopEnd, seekTo, loopActive, toggleLoopActive } =
    usePlayerControl();
  const load = () => {
    setLoopStart(loop.startSec);
    setLoopEnd(loop.endSec);
    seekTo(loop.startSec);
    if (!loopActive) toggleLoopActive();
  };
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 6,
        background: 'var(--panel-2)',
        border: '1px solid var(--border)',
        fontSize: 12,
      }}
    >
      <button
        type="button"
        onClick={load}
        style={{
          all: 'unset',
          flex: 1,
          cursor: 'pointer',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600, flex: 1 }}>{loop.label}</span>
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            color: 'var(--text-dim)',
          }}
        >
          {fmt(loop.startSec)}–{fmt(loop.endSec)}
        </span>
      </button>
      <button
        type="button"
        onClick={onDeleted}
        aria-label={`Delete loop ${loop.label}`}
        style={{
          all: 'unset',
          cursor: 'pointer',
          padding: '0 4px',
          color: 'var(--text-dim)',
        }}
      >
        ×
      </button>
    </li>
  );
}

function SaveLoopRow({
  videoId,
  onSaved,
}: {
  videoId: string;
  onSaved: () => void;
}) {
  const { loopStartSec, loopEndSec } = usePlayerControl();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const canSave = loopEndSec != null && loopEndSec > (loopStartSec ?? 0);

  const reset = () => {
    setOpen(false);
    setLabel('');
  };

  const submit = () => {
    const trimmed = label.trim();
    if (!trimmed || !canSave) return;
    addLoop({
      videoId,
      label: trimmed,
      startSec: loopStartSec ?? 0,
      endSec: loopEndSec!,
    });
    reset();
    onSaved();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canSave}
        className="chip"
        title={
          canSave
            ? 'Save the current A/B section as a named loop'
            : 'Mark a section with the A / B buttons under the player first'
        }
        style={{ width: '100%', padding: '6px 12px' }}
      >
        + Save loop
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      style={{ display: 'flex', gap: 6 }}
    >
      <input
        type="text"
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. Verse 1, Chorus"
        maxLength={120}
        onKeyDown={(e) => {
          if (e.key === 'Escape') reset();
        }}
        style={{
          flex: 1,
          padding: '6px 10px',
          fontSize: 13,
          border: '1px solid var(--border)',
          borderRadius: 6,
          background: 'var(--panel-2)',
          color: 'var(--text)',
          fontFamily: 'inherit',
        }}
      />
      <button type="submit" className="chip active" style={{ padding: '6px 12px' }}>
        Save
      </button>
      <button
        type="button"
        onClick={reset}
        className="chip"
        style={{ padding: '6px 12px' }}
      >
        Cancel
      </button>
    </form>
  );
}

// Force-include useEffect import (no-op — keeps tree-shaker honest).
void useEffect;
