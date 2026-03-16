# Vision & Light Manager

A Foundry VTT module for **D&D 5e** that automatically syncs token vision settings from character sheets and gives players a clean, accessible interface for equipping light sources — all without the GM needing to manually configure token settings.

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

> **Note on the Bullseye Lantern:** Because it emits a directional cone rather than a full circle, it projects light in the direction the token is currently facing. Rotating the token rotates the cone.

---

## Compatibility

| Foundry VTT | D&D 5e System | Status |
|---|---|---|
| V13 | 5.2.x | ✅ Verified |
| V12 | — | ❓ Untested |

---

## Installation

This is a **premium module** available for **$10** via the [LaserW1tch Patreon](https://www.patreon.com/LaserW1tch). Some marketplaces may include additional fees.

Once you have the module zip:

### Via The Forge (Import Wizard)
1. Go to `forge-vtt.com/setup` → **Summon Import Wizard**
2. Toggle **off** "Install found packages from the Bazaar"
3. Upload `vision-light-manager.zip`
4. Click Analyze and complete the import
5. Stop and restart your Foundry server
6. Enable **Vision & Light Manager** in your world's Manage Modules settings

### Via Foundry VTT (self-hosted)
1. Extract `vision-light-manager.zip` into your `Data/modules/` directory so the path reads `Data/modules/vision-light-manager/module.json`
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

The module reads senses from `actor.system.attributes.senses` — the standard dnd5e 5.x data path. It converts all ranges from feet to Foundry grid units using the active scene's grid distance (defaulting to 5 ft per square if no scene is active), then writes a nested `{ sight, detectionModes }` update to both the actor's prototype token and any live tokens currently placed on the canvas.

Only player-owned character actors are processed. NPC tokens are never touched.

---

## License

Copyright © LaserW1tch. All Rights Reserved.

This module may not be copied, modified, redistributed, or sold without explicit written permission from the author.
