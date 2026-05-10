# CLAUDE.md

Guidance for Claude Code working in this repo.

## Project

**TriadView** — a visual + audio reference for **Ableton Push producers learning piano and guitar**. Push is the user's anchor instrument; piano and guitar are the destinations they're trying to learn. The app shows the same chord/scale/note across all three views simultaneously, plays it via Web Audio, and surfaces theoretical relationships (diatonic chords in a scale, scales containing a chord).

The app code lives under `app/`. It's a static SPA — no backend, no database, no accounts.

Read `README.md` for the user-facing summary and `resources/01-product.md` … `06-build.md` for the original product/spec (immutable history — don't edit).

## Stack

- React 18 + TypeScript + Vite (in `app/`)
- `tonal` for music theory (chord/scale/interval lookups, 100+ chord types)
- SVG for all instrument views
- Web Audio API for playback (custom 50-line synth in `audio/synth.ts`)
- React `useState` + URL params for state — no backend, no DB, no auth

## Working in the codebase

All commands run from `app/`:
- `npm run dev` — dev server (Vite picks a free port; we usually use `--port 5180`)
- `npm run build` — production build (also runs `tsc -b` for full type-check)

After non-trivial changes, run `npm run build` to type-check the whole tree. Tests aren't set up. Verify visually via the dev server (Playwright works against `localhost`; see `/tmp/triadview_*.py` for past patterns).

## Code structure

```
app/src/
  types.ts                     # all domain types (PitchClass, ChordQuality, ScaleType, etc.)
  App.tsx                      # composition root
  state/
    useAppState.ts             # all state + URL sync (transient state lives here too)
    resolve.ts                 # selection → per-instrument notes + metadata
  audio/
    synth.ts                   # Web Audio synth (triangle voices, AD envelope)
  theory/
    notes.ts                   # MIDI/note conversion + ascending-note builder + display-map builder
    chords.ts                  # tonal wrapper for chord notes + voicings stack
    scales.ts                  # tonal wrapper for scale notes
    degrees.ts                 # interval → "1, b3, 5, b7" labels
    positions.ts               # 5 CAGED scale shapes + parent-major lookup
    diatonic.ts                # diatonic 7th chords from a scale (with Roman numerals)
    chord-scales.ts            # reverse: every scale containing a given chord
    voicings/
      piano.ts                 # closed / drop-2 / wide
      guitar.ts                # shape realization + transposition
      guitar-shapes.ts         # handcrafted barre-chord shape table
      push.ts                  # pitch-class flood (no voicing concept on Push)
  instruments/
    piano/{layout,PianoView}.tsx
    guitar/{layout,GuitarView}.tsx
    push/{layout,PushView}.tsx
    notation/
      SheetMusicView.tsx       # 5-line staff with treble clef, stack/sequence/single
      TabView.tsx              # 6-line guitar TAB with note-letter labels
  components/
    SelectionBar.tsx           # all the picker chips
```

Conventions:
- `theory/` contains music theory only — no React, no rendering.
- `instruments/` contains layout math and SVG rendering only — no theory.
- `state/` is the glue.
- Pitch classes are stored as sharps internally (`'C' | 'C#' | …`). For DISPLAY we override with the correct enharmonic per key (e.g. F major shows `Bb`, not `A#`) via `pcDisplay` derived in `resolve.ts` from tonal's note names.
- String indexing on guitar: `0 = high E … 5 = low E`.
- Push pad indexing: `row 0 = bottom row` (lowest pitch); rendered with row 0 at the visual bottom.

## Key concepts

### View modes
4 modes selectable in the SelectionBar:
- **Chord** — root + quality (29 qualities supported, from triads to altered dominants)
- **Scale** — root + scale type (major, modes, harmonic/melodic minor, pentatonics, blues)
- **Note** — single pitch class
- **All** — every position lit; reference view for memorizing fretboard/keyboard

### Guitar shapes (CAGED)
Major-derived scales (major, modes, pentatonics) get a "Shape" picker (1–5) that filters the guitar fretboard to one of 5 hand-curated CAGED shapes. Numbering follows guitarscale.org:
- Shape 1 = E-shape (E-barre area)
- Shape 2 = D-shape
- Shape 3 = C-shape (octave up)
- Shape 4 = A-shape
- Shape 5 = G-shape

Modes anchor on the **parent major** (D Dorian uses C-major shapes with D highlighted as root). Non-major-derived scales (harmonic/melodic minor, blues) don't get a position selector.

### Diatonic chords (in scale mode)
Every 7-note scale shows a "Chords in this scale" panel with the 7 diatonic 7th chords as chips: `Imaj7 / iim7 / iiim7 / IVmaj7 / V7 / vim7 / viim7♭5` (for major). Click a chip to **highlight that triad within the scale** (the rest of the scale dims). Stays in scale mode — does NOT switch to chord mode.

### Scales containing this chord (in chord mode)
The reverse: every scale whose pitch classes are a superset of the chord shows up as a chip, sorted by tightest fit. Click → switch to scale mode for that scale. Closes the chord↔scale loop.

### Audio
Click any key/fret/pad → plays the note via Web Audio synth. ▶ Play button plays the current chord (stacked) or scale (arpeggiated). Mute toggle in header. AudioContext is created lazily on first user gesture.

## Reference sources

When validating music theory output (especially scale shapes, fingerings, chord voicings), cross-check against authoritative reference sites rather than guessing. Primary:

- **<https://www.guitarscale.org/>** — guitar scale shapes, all 12 keys × all common scales. No API.
  - Page: `https://www.guitarscale.org/<scale>.html` (e.g. `c-major.html`)
  - Shape images: `https://www.guitarscale.org/images/<scale>_box<N>.png` for N in 1..5
  - **WebFetch returns text only and will NOT show shape data** — instead, `curl -O` the box images into a temp dir and Read them as image files. Each numbered dot = a fingering (1=index … 4=pinky); the darker filled dot = the tonic.
  - Used as source of truth for `theory/positions.ts` (CAGED scale shapes).

When transcribing shapes from images, list each string's fret positions and double-check by computing each note's pitch class — easy to miss a position when the image has many dots.

## Things to keep in mind

- The audience is **producers who already know Push** and want to play piano/guitar fluently enough to become better musicians. NOT pianists or guitarists. Push stays prominent.
- Spec docs in `resources/` are immutable history — don't edit them, treat them as read-only context.
- The position selector (CAGED) only applies to major-derived 7-note scales and only filters the **guitar** view. Piano and Push always show the full scale; mirroring a guitar fingering onto piano was tried and rejected as confusing.
- Diatonic chord chips do NOT switch modes — they preview the chord *within* the scale view. The user wanted to see the chord in the context of the scale, not switch contexts.
- Don't add a fret-shifting / arrow-key feature for shapes — shapes are anchored to the scale's tonic, not free-floating. (We had this and removed it.)
- Don't introduce: Redux/Zustand, a backend, an auth provider, an analytics SDK, or Tailwind unless the user explicitly asks. (Strapi has been suggested twice and rejected twice — static reference data doesn't need a CMS.)
- Note display uses the **correct enharmonic per key** (F major shows Bb, not A#). The PC type is sharps-only internally; `resolve.ts` builds a `pcDisplay` map from tonal's actual note names and the views use that.

## State machine

`useAppState` owns everything. State splits into:
- **Persistent (URL-synced):** `mode`, `chord` (root/quality/inversion/voicingIndex), `scale` (root/type), `singleNote`, `scalePosition`.
- **Transient (in-memory only):** `focusedPitchClass`, `labelMode` (notes/degrees), `showNaturals`, `audioMuted`, `previewedChordDegree`.

URL schema: `?mode=chord&root=C&quality=maj7&inv=0&v=0` etc. Invalid params silently fall back to defaults.

## Open work / next steps

- **Ear-training games** (planned in task #36): find-the-note, chord-by-ear, scale-by-ear, intervals, degrees, progressions, inversions. Reuses synth + theory layer. Optional persistence later.
- **Verify all 12 keys** against guitarscale.org. Currently only C and F are explicitly verified. Other keys *should* work via the wrap rule but haven't been visually compared.
- **Mobile layout** — currently desktop-only. Three side-by-side panels stack reasonably on mobile but the SelectionBar gets cramped.
- **Deploy** — Cloudflare Pages was the chosen target. App is feature-complete; needs git init + GitHub repo + Cloudflare connection.
