# Harbor Jelly — lyrical novel prototype

2026-10-14: Bishop selected visual concept 3. The implementation is saved as an unfinished prototype for later development. Bishop then redirected the task to the original miniature harbor and other interactive objects. This prototype has not been deployed.

## Implemented

- Three generated scene plates, aligned depth maps, and five character portraits.
- Three.js depth-relief mesh with bounded drag, zoom, page camera moves, crossfades, rain and water distortion.
- Two 12-page narratives, evidence dialogs, chronological record puzzle, reading notes, local progress, optional browser-synthesized sea ambience.
- Local fonts and Phosphor icons; icon and font licenses included.

## Verified so far

- Node syntax checks for novel.js, novel-data.js, cinematic-scene.js; git diff whitespace check.
- Local browser desktop opening scene, cast dialog, direct drag and zoom, first archive transition and tape inspection.
- Compared chosen reference and opening desktop screenshot at approximately 1486×1058.
- Fixed transient loading overlay visibility and restored coherent chapter labels.
- Mobile fixed reading controls were implemented but have not yet been visually verified.

## Resume checklist

- Verify both narrative endings, both choices, evidence notebook, chronological puzzle and sound toggle.
- Inspect mobile and tablet layouts, especially long text in readingFlow.
- Complete design-qa.md before deploying.
- Scene depth is shallow 2.5D relief; it is not a complete solid environment or independent animated character model. Explore actual 3D scene assets if free orbit and character action become requirements.

## Preview

Serve the repository's dist directory with a static HTTP server. The current owned preview uses port 8765.
