# Development Status

## 2026-11-13 — 1.2.0 release package prepared

- **Scope:** Prepare the Control Flames changes as a new GitHub release and then verify the package through The Forge.
- **Prepared:** Bumped `module.json` and README installation/download references to 1.2.0; moved the changelog entry into `1.2.0`.
- **Artifact:** `releases/vision-light-manager-v1.2.0.zip` and its `.sha256` file were generated. The package script verified the ZIP and its eight included files. SHA-256: `74a8ce3268a84783951c8d28dee77cb7025db118be9a3ecfe68329ebfefc7950`. Release artifacts are ignored by Git and must be attached to the GitHub release separately.
- **Repository state:** Project changes were staged locally before the owner clarified that GitHub repository updates must be handled through the Windows desktop app. No commit or remote push was made. Review and stage all remaining changes in GitHub Desktop before committing.
- **Publishing / Forge verification:** Not completed. GitHub CLI reported an invalid saved token; use the Windows desktop app and GitHub website as requested. No Forge account/browser interaction is available in this session.
- **Next steps:** Commit and push the 1.2.0 changes with GitHub Desktop; create the 1.2.0 GitHub release and attach the ZIP; import that ZIP through The Forge Summon Import Wizard and verify the Control Flames toggle and world-time expiry in the intended test world.

## 2026-11-13 — Control Flames and light-affecting abilities

- **Scope:** Add the requested Control Flames light-range control and research other character abilities that affect lights.
- **Implemented:** The light dialog now has a Control Flames checkbox for nonmagical flame presets (candle, torch, lamp, and lanterns). Enabling it doubles the bright/dim radii, stores the original radii with an expiry at current Foundry world time + 3,600 seconds, and restores the original radii when world time advances past that expiry. The effect flag persists on the token so it survives closing the dialog/reloading.
- **Files changed:** `scripts/light-gui.js`, `templates/light-gui.html`, `styles/light-gui.css`, `README.md`, and `CHANGELOG.md`.
- **Research:** 5e.tools was explicitly requested, but its spell page returned HTTP 403 in the research environment. D&D Beyond spell references were used as a fallback. Control Flames is the direct bright/dim-range modifier. Thaumaturgy can brighten/dim/change the color of flames for one minute, but does not specify numeric radii; Druidcraft and Prestidigitation can light or snuff small flames. Darkness suppresses nonmagical light and cancels lower-level light spells in overlapping areas; Daylight creates a broad sunlight area and counters Darkness, while Continual Flame creates a persistent torch-equivalent flame. The latter effects create or suppress scene illumination rather than changing the selected token preset. Follow-up recommendation: consider a separate qualitative flame-state control for Thaumaturgy; the numerical-range toggle is sufficient for Control Flames' requested scope.
- **Reference links:** [Control Flames](https://www.dndbeyond.com/spells/2374-control-flames), [Thaumaturgy](https://www.dndbeyond.com/spells/2619174-thaumaturgy), [Druidcraft](https://www.dndbeyond.com/spells/2619158-druidcraft), [Prestidigitation](https://www.dndbeyond.com/spells/2618893-prestidigitation), [Darkness](https://www.dndbeyond.com/spells/2619080-darkness), [Continual Flame](https://www.dndbeyond.com/spells/2619065-continual-flame), [Daylight](https://www.dndbeyond.com/sources/dnd/br-2024/spell-descriptions).
- **Verification:** Source/template/style changes were reviewed but not run in Foundry. No tests were added or run. Runtime expiry behavior and player permissions remain unverified.
- **Next step:** Inspect the diff and, when convenient, verify the toggle and its one-hour expiry in the local testbed using a flame preset and world-time advancement.

## 2026-11-13

- **Scope:** The user identified the Vision & Light Manager project and wants to work on it; no specific feature, defect, or change has been requested yet.
- **Project baseline:** `README.md` describes automatic D&D 5e token vision synchronization and the Light & Vision sidebar panel. `CHANGELOG.md` documents version 1.1.0 and verification on Foundry V14.367 with D&D 5e 6.0.6.
- **Files inspected:** workspace and Foundry project `AGENTS.md` instructions, project `README.md`, `CHANGELOG.md`, and `module.json`.
- **Changes:** No implementation changes made. This status file records the investigation for handoff.
- **Working tree:** `CHANGELOG.md` was already modified before this task; preserve that change and inspect its diff before editing it.
- **Verification:** Documentation and package metadata were read. No tests or runtime checks were run.
- **Next step:** Ask which manager task the user wants to tackle, then inspect the relevant source and implement it.
