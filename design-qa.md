# Design QA — lyrical prototype

final result: blocked

The user deferred this novel/game prototype on 2026-10-14 and redirected the active request to inspection of the original miniature harbor reference. This is a saved work in progress, not a finished handoff.

Reference: concept 3, exec-6b8a26f9-3cb9-473a-97cf-99a743b09b8e.png (1487×1058).
Implementation capture: /Users/bishop/Documents/hongson/harbor-jelly-previews/lyrical-desktop.jpg (1486×1058 CSS viewport).
Both artifacts were opened together for comparison. A 1px width difference is immaterial. Opening scene and prose are the same state; the earliest captures caught transient animation and were recaptured after camera settled.

## Surfaces reviewed

- Typography: local Gowun Batang for Korean novel text and Inter for navigation. Clear hierarchy. Korean glyphs were subset from current app text. Desktop body was readable; mobile has not been checked.
- Spacing: source upper-left reading layout, full-viewport artwork, upper-center genre control and upper-right camera controls retained. Desktop paragraph spacing and heading gap adjusted closer to source.
- Colors: ivory prose, petrol controls, warm lamps and muted cold harbor preserved. Later mystery scenes apply cold tint and distant fog.
- Image quality: new UI-free scene plate closely preserves selected concept, with expected generation changes and small overscan for shallow camera movement. Portraits and secondary scenes are real generated assets, not vector placeholders.
- Copy: coherent common closure-night premise; separate mystery and romance causality. Full endings and choice paths remain unverified.
- Icons: licensed Phosphor SVG assets; no custom SVG illustration stand-ins.
- Behavior checked: direct camera drag/zoom, cast dialog, first archive transition and tape dialog. Core full story/puzzle/audio/notes and responsive states remain pending.

## Findings fixed during partial QA

- Loading overlay could still paint during its opacity transition after scene was ready; now it becomes visibility:hidden.
- Chapter labels suggested multiple current nights although the story takes place in one evening; changed later sections to chapters.
- Mobile long text could place progression controls below the reading viewport; introduced independently scrolling readingFlow with controls outside it. Post-fix mobile capture is still required.

## Remaining

Complete the DEVELOPMENT-NOTES.md resume checklist and responsive verification. Do not describe this prototype as QA-passed or deployed.
