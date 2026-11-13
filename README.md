# Vision & Light Manager

A Foundry VTT module for **D&D 5e** that automatically syncs token vision settings from character sheets and gives players a simple panel for equipping light sources — all without the GM needing to manually configure token settings.

---

## Features

### Automatic Vision Sync
The module reads each player character's senses directly from their D&D 5e character sheet and applies them to their token automatically — no manual token configuration required.

Supported vision types:
- **Darkvision** — sets sight range and vision mode
- **Blindsight** — added as a detection mode with correct range
- **Truesight** — added as a detection mode with correct range
- **Tremorsense** — added as a detection mode with correct range

Vision syncs automatically in two situations:
- **On world load** — all player-owned character tokens are synced when the world is opened
- **On sheet update** — if a character gains or loses a sense (level up, magic item, etc.) and their sheet is saved, their token updates immediately

### Light Source Manager
A sidebar button (🔥) appears in the Foundry sidebar tab strip for all users. Clicking it opens the **Light & Vision panel** for the currently selected token, which has two sections:

**Vision Summary** — displays the character's current senses and their ranges, pulled live from the character sheet. Includes a one-click re-sync button in case a manual refresh is needed.

**Light Source Grid** — a 3-column grid of light source cards. Click any card to instantly apply that light source to the selected token. The currently active source is highlighted. Available light sources:

| Light Source | Bright | Dim | Notes |
|---|---|---|---|
| No Light | — | — | Extinguishes all light |
| Candle | 5 ft | 10 ft | Flickering animation |
| Torch | 20 ft | 40 ft | |
| Lamp | 15 ft | 45 ft | |
| Hooded Lantern (Open) | 30 ft | 60 ft | |
| Hooded Lantern (Hooded) | — | 5 ft | |
| Bullseye Lantern | 60 ft | 120 ft | Directional cone (52.5°) |
| Dancing Lights | — | 10 ft | Pulse animation |
| Light Cantrip | 20 ft | 40 ft | |

For a nonmagical flame preset (candle, torch, lamp, or lantern), the panel also provides a **Control Flames** toggle that doubles its bright- and dim-light ranges for one hour of world time. The toggle is unavailable for magical sources such as Dancing Lights and Light. This implements the requested doubled ranges; it does not model the spell's other options, such as halving the light, changing its color, or expanding/extinguishing the flame.

> **Note on the Bullseye Lantern:** Because it emits a directional cone rather than a full circle, it projects light in the direction the token is currently facing. Rotating the token rotates the cone.

---

## Compatibility

| Foundry VTT | D&D 5e System | Status |
|---|---|---|
| V14.367 | 6.0.6 | Verified in the local testbed |
| V13 | 5.2.5 | Previously listed as verified; not independently rechecked |

---

## Installation

Download the current module archive, [`vision-light-manager-v1.2.0.zip`](https://github.com/LaserW1tch/vision-and-light-management/releases/download/1.2.0/vision-light-manager-v1.2.0.zip), from the project's GitHub release page.

### Via The Forge (Import Wizard)
1. Go to `forge-vtt.com/setup` → **Summon Import Wizard**
2. Toggle **off** "Install found packages from the Bazaar"
3. Upload `vision-light-manager-v1.2.0.zip`
4. Click Analyze and complete the import
5. Stop and restart your Foundry server
6. Enable **Vision & Light Manager** in your world's Manage Modules settings

### Via Foundry VTT (self-hosted)
1. Extract `vision-light-manager-v1.2.0.zip` into your `Data/modules/` directory so the path reads `Data/modules/vision-light-manager/module.json`
2. Restart Foundry
3. Enable the module in your world's Manage Modules settings

### Via Foundry Package Manager
Once listed on the official Foundry VTT marketplace, you can paste the manifest URL directly into the **Install Module** dialog:
```
https://raw.githubusercontent.com/LaserW1tch/vision-and-light-management/main/module.json
```

---

## Usage

### Opening the Light & Vision Panel
1. Select a character token on the canvas
2. Click the **🔥 fire icon** in the sidebar tab strip
3. The Light & Vision panel opens for that token

The panel is accessible to both GMs and players. Players can only open it for tokens they own. The GM can open it for any character token.

### Vision Auto-Sync
No action is required. Vision syncs automatically on world load and whenever a character sheet is saved. To manually trigger a re-sync for a specific token, open the Light & Vision panel and click **↺ Re-sync Vision from Sheet**.

You can also trigger a full re-sync for all player characters from the browser console:
```js
game.modules.get("vision-light-manager").api.syncAllPlayerActors();
```

Or open the GUI for the currently selected token from a macro:
```js
game.modules.get("vision-light-manager").api.openLightGui();
```

---

## How Vision Sync Works

The module reads senses from the current `actor.system.attributes.senses.ranges` path and falls back to the earlier `actor.system.attributes.senses` fields for older D&D 5e versions. Foundry expects vision and detection ranges in the Scene's distance units, so the module writes D&D 5e's feet values directly; configure the Scene's distance unit as feet. It updates the actor's prototype token and placed tokens, preserving detection modes managed by other modules. Automatic world-load syncing runs from the GM client to avoid duplicate writes from each connected player.

Only player-owned character actors are processed. NPC tokens are never touched.

## Future goals

- Support metric measurement systems for sense ranges and light presets.
- Consider additional controls for flame-affecting cantrips such as Thaumaturgy; see `DEVELOPMENT_STATUS.md` for the research notes.

---

## License

Copyright © LaserW1tch. All Rights Reserved.

This module may not be copied, modified, redistributed, or sold without explicit written permission from the author.

## Building a release archive

From the repository root, run `python scripts/package.py`. The archive and SHA-256 file are written to `releases/`. The archive includes the module files and public documentation, with `module.json` inside the `vision-light-manager/` folder.
