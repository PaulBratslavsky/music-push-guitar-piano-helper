import type { Note, PianoKey, PitchClass } from '../../types';
import { defaultPianoLayout } from './layout';
import { midiFromNote } from '../../theory/notes';

type Props = {
  highlighted: Note[];
  rootPitchClass?: PitchClass | null;
  matchByPitchClass?: boolean;
  focusedPitchClass?: PitchClass | null;
  onPickPitchClass?: (pc: PitchClass) => void;
  /** Called with the exact midi number on click (used for audio playback). */
  onPlayNote?: (midi: number) => void;
  pcLabels?: Partial<Record<PitchClass, string>>;
  emphasizedPitchClasses?: Set<PitchClass> | null;
};

const WHITE_W = 28;
const WHITE_H = 150;
const BLACK_W = 18;
const BLACK_H = 96;
const PADDING_X = 8;
const PADDING_Y = 10;

export function PianoView({
  highlighted,
  rootPitchClass,
  matchByPitchClass = false,
  focusedPitchClass,
  onPickPitchClass,
  onPlayNote,
  pcLabels,
  emphasizedPitchClasses,
}: Props) {
  const isDimmed = (pc: PitchClass) =>
    emphasizedPitchClasses != null && !emphasizedPitchClasses.has(pc);
  const keys = defaultPianoLayout();
  const whiteKeys = keys.filter((k) => !k.isBlack);
  const blackKeys = keys.filter((k) => k.isBlack);

  const highlightedMidis = new Set(highlighted.map(midiFromNote));
  const highlightedPCs = new Set<PitchClass>(highlighted.map((n) => n.pitchClass));

  const isLit = (key: PianoKey) =>
    matchByPitchClass
      ? highlightedPCs.has(key.note.pitchClass)
      : highlightedMidis.has(midiFromNote(key.note));

  const isRoot = (key: PianoKey) =>
    rootPitchClass != null && key.note.pitchClass === rootPitchClass && isLit(key);

  const isFocused = (key: PianoKey) =>
    focusedPitchClass != null && key.note.pitchClass === focusedPitchClass;

  const width = whiteKeys.length * WHITE_W + PADDING_X * 2;
  const height = WHITE_H + PADDING_Y * 2;

  const handle = (key: PianoKey) => () => {
    onPickPitchClass?.(key.note.pitchClass);
    onPlayNote?.(midiFromNote(key.note));
  };

  return (
    <svg
      className="instrument-svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Piano keyboard"
    >
      {whiteKeys.map((key, i) => {
        const x = PADDING_X + i * WHITE_W;
        const lit = isLit(key);
        const root = isRoot(key);
        const focused = isFocused(key);
        return (
          <g
            key={`w-${i}`}
            className="clickable"
            onClick={handle(key)}
            style={{ cursor: onPickPitchClass ? 'pointer' : 'default' }}
          >
            <rect
              x={x}
              y={PADDING_Y}
              width={WHITE_W}
              height={WHITE_H}
              rx={3}
              ry={3}
              fill="var(--white-key)"
              stroke={focused ? 'var(--focus)' : '#bdc3cf'}
              strokeWidth={focused ? 2.5 : 1}
            />
            {lit && (
              <g pointerEvents="none" opacity={isDimmed(key.note.pitchClass) ? 0.3 : 1}>
                <circle
                  cx={x + WHITE_W / 2}
                  cy={PADDING_Y + WHITE_H - 22}
                  r={10}
                  fill={root ? 'var(--root)' : 'var(--highlight)'}
                  stroke="#0b0d12"
                  strokeWidth={1}
                />
                {pcLabels?.[key.note.pitchClass] && (
                  <text
                    x={x + WHITE_W / 2}
                    y={PADDING_Y + WHITE_H - 19}
                    fontSize={9}
                    fill="#0b0d12"
                    textAnchor="middle"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontWeight={700}
                  >
                    {pcLabels[key.note.pitchClass]}
                  </text>
                )}
              </g>
            )}
            {focused && (
              <circle
                cx={x + WHITE_W / 2}
                cy={PADDING_Y + WHITE_H - 50}
                r={7}
                fill="none"
                stroke="var(--focus)"
                strokeWidth={2.5}
                pointerEvents="none"
              />
            )}
            <text
              x={x + WHITE_W / 2}
              y={PADDING_Y + WHITE_H - 6}
              fontSize={9}
              fill={focused ? 'var(--focus)' : '#7a7f8b'}
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontWeight={focused ? 700 : 400}
            >
              {key.note.pitchClass}
              {key.note.octave}
            </text>
          </g>
        );
      })}

      {blackKeys.map((key, i) => {
        const x = PADDING_X + key.index * WHITE_W - BLACK_W / 2;
        const lit = isLit(key);
        const root = isRoot(key);
        const focused = isFocused(key);
        return (
          <g
            key={`b-${i}`}
            className="clickable"
            onClick={handle(key)}
            style={{ cursor: onPickPitchClass ? 'pointer' : 'default' }}
          >
            <rect
              x={x}
              y={PADDING_Y}
              width={BLACK_W}
              height={BLACK_H}
              rx={2}
              ry={2}
              fill="var(--black-key)"
              stroke={focused ? 'var(--focus)' : '#000'}
              strokeWidth={focused ? 2.5 : 1}
            />
            {lit && (
              <g pointerEvents="none" opacity={isDimmed(key.note.pitchClass) ? 0.3 : 1}>
                <circle
                  cx={x + BLACK_W / 2}
                  cy={PADDING_Y + BLACK_H - 14}
                  r={8}
                  fill={root ? 'var(--root)' : 'var(--highlight)'}
                  stroke="#0b0d12"
                  strokeWidth={1}
                />
                {pcLabels?.[key.note.pitchClass] && (
                  <text
                    x={x + BLACK_W / 2}
                    y={PADDING_Y + BLACK_H - 11}
                    fontSize={8}
                    fill="#0b0d12"
                    textAnchor="middle"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontWeight={700}
                  >
                    {pcLabels[key.note.pitchClass]}
                  </text>
                )}
              </g>
            )}
            {focused && (
              <circle
                cx={x + BLACK_W / 2}
                cy={PADDING_Y + BLACK_H - 40}
                r={6}
                fill="none"
                stroke="var(--focus)"
                strokeWidth={2.5}
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
