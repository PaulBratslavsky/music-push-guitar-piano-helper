import type { Note, PitchClass } from '../../types';
import { buildPushLayout, PUSH_COLS, PUSH_ROWS } from './layout';
import { midiFromNote } from '../../theory/notes';

type Props = {
  highlighted: Note[];
  rootPitchClass?: PitchClass | null;
  focusedPitchClass?: PitchClass | null;
  onPickPitchClass?: (pc: PitchClass) => void;
  /** Called with the exact midi number on click (used for audio playback). */
  onPlayNote?: (midi: number) => void;
  /** Optional override map: PC → label to display on lit pads (e.g., scale degrees). */
  pcLabels?: Partial<Record<PitchClass, string>>;
  emphasizedPitchClasses?: Set<PitchClass> | null;
};

const PAD = 44;
const GAP = 4;
const PADDING = 12;

export function PushView({
  highlighted,
  rootPitchClass,
  focusedPitchClass,
  onPickPitchClass,
  onPlayNote,
  pcLabels,
  emphasizedPitchClasses,
}: Props) {
  const grid = buildPushLayout();

  const highlightedPCs = new Set<PitchClass>(highlighted.map((n) => n.pitchClass));

  const isLit = (note: Note) => highlightedPCs.has(note.pitchClass);
  const isRoot = (pc: PitchClass) => rootPitchClass != null && pc === rootPitchClass;
  const isFocused = (pc: PitchClass) => focusedPitchClass != null && pc === focusedPitchClass;

  const totalWidth = PADDING * 2 + PUSH_COLS * PAD + (PUSH_COLS - 1) * GAP;
  const totalHeight = PADDING * 2 + PUSH_ROWS * PAD + (PUSH_ROWS - 1) * GAP;

  const xForCol = (col: number) => PADDING + col * (PAD + GAP);
  const yForDisplayRow = (displayRow: number) =>
    PADDING + displayRow * (PAD + GAP);

  return (
    <svg
      className="instrument-svg"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      role="img"
      aria-label="Ableton Push grid (chromatic mode)"
    >
      {grid.flatMap((row, rIdx) =>
        row.map((pad) => {
          const displayRow = PUSH_ROWS - 1 - rIdx;
          const x = xForCol(pad.col);
          const y = yForDisplayRow(displayRow);
          const lit = isLit(pad.note);
          const root = isRoot(pad.note.pitchClass);
          const focused = isFocused(pad.note.pitchClass);
          const dimmed =
            lit &&
            emphasizedPitchClasses != null &&
            !emphasizedPitchClasses.has(pad.note.pitchClass);
          const fill = lit
            ? root
              ? 'var(--pad-on-root)'
              : 'var(--pad-on)'
            : 'var(--pad)';
          const textFill = lit ? '#0b0d12' : 'var(--text-dim)';
          const label = lit && pcLabels?.[pad.note.pitchClass]
            ? (pcLabels[pad.note.pitchClass] as string)
            : pad.note.pitchClass;
          return (
            <g
              key={`pad-${pad.row}-${pad.col}`}
              style={{ cursor: onPickPitchClass ? 'pointer' : 'default' }}
              onClick={() => {
                onPickPitchClass?.(pad.note.pitchClass);
                onPlayNote?.(midiFromNote(pad.note));
              }}
              opacity={dimmed ? 0.35 : 1}
            >
              <rect
                x={x}
                y={y}
                width={PAD}
                height={PAD}
                rx={6}
                ry={6}
                fill={fill}
                stroke={focused ? 'var(--focus)' : lit ? '#0b0d12' : '#0f1115'}
                strokeWidth={focused ? 3 : 1.5}
              />
              <text
                x={x + PAD / 2}
                y={y + PAD / 2 + 4}
                fontSize={11}
                fontWeight={lit || focused ? 700 : 500}
                fill={focused && !lit ? 'var(--focus)' : textFill}
                textAnchor="middle"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                pointerEvents="none"
              >
                {label}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}
