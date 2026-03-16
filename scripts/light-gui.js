/**
 * light-gui.js
 * Provides a styled dialog that lets players quickly equip a light source.
 * MODULE_ID is declared in vision-sync.js which loads first.
 */

// MODULE_ID is already declared globally by vision-sync.js


// ── LIGHT SOURCE DEFINITIONS ──────────────────────────────────────────────────
// All distances in feet (Foundry converts to grid units internally).
// bright + dim refer to the two light radii.
// angle: 360 = omnidirectional, 52.5 = bullseye cone

const LIGHT_SOURCES = [
  {
    id:    "none",
    label: "No Light",
    icon:  "🌑",
    dim:   0,
    bright:0,
    angle: 360,
    color: "#000000",
    alpha: 0,
    animation: { type: "none", speed: 0, intensity: 0 },
  },
  {
    id:    "candle",
    label: "Candle",
    icon:  "🕯️",
    bright: 5,
    dim:   10,
    angle: 360,
    color: "#ffaa44",
    alpha: 0.25,
    animation: { type: "torch", speed: 2, intensity: 3 },
  },
  {
    id:    "torch",
    label: "Torch",
    icon:  "🔥",
    bright: 20,
    dim:   40,
    angle: 360,
    color: "#ff8c00",
    alpha: 0.3,
    animation: { type: "torch", speed: 3, intensity: 4 },
  },
  {
    id:    "lamp",
    label: "Lamp",
    icon:  "🪔",
    bright: 15,
    dim:   45,
    angle: 360,
    color: "#ffcc66",
    alpha: 0.25,
    animation: { type: "torch", speed: 1, intensity: 2 },
  },
  {
    id:    "hooded_lantern_open",
    label: "Hooded Lantern (Open)",
    icon:  "🏮",
    bright: 30,
    dim:   60,
    angle: 360,
    color: "#ffbb44",
    alpha: 0.3,
    animation: { type: "torch", speed: 2, intensity: 3 },
  },
  {
    id:    "hooded_lantern_hood",
    label: "Hooded Lantern (Hooded)",
    icon:  "🏮",
    bright: 0,
    dim:   5,
    angle: 360,
    color: "#ffbb44",
    alpha: 0.15,
    animation: { type: "none", speed: 0, intensity: 0 },
  },
  {
    id:    "bullseye_lantern",
    label: "Bullseye Lantern",
    icon:  "🔦",
    bright: 60,
    dim:   120,
    angle: 52.5,
    color: "#ffdd88",
    alpha: 0.35,
    animation: { type: "torch", speed: 2, intensity: 2 },
  },
  {
    id:    "dancing_lights",
    label: "Dancing Lights",
    icon:  "✨",
    bright: 0,
    dim:   10,
    angle: 360,
    color: "#aaddff",
    alpha: 0.2,
    animation: { type: "pulse", speed: 3, intensity: 4 },
  },
  {
    id:    "light_cantrip",
    label: "Light Cantrip",
    icon:  "💡",
    bright: 20,
    dim:   40,
    angle: 360,
    color: "#ffffff",
    alpha: 0.25,
    animation: { type: "pulse", speed: 2, intensity: 2 },
  },
];

// ── HELPER: convert ft → Foundry units ───────────────────────────────────────
// Foundry V13 stores light radii in scene grid units (not feet directly).
// Default 5e grid: 1 square = 5ft, so divide by 5 to get squares,
// then multiply by scene grid size in pixels. We use the scene's
// distancePixels helper if available, otherwise assume 1 unit = 1ft.
function ftToUnits(ft) {
  if (!ft || ft === 0) return 0;
  const scene = game.scenes?.active;
  if (!scene) return ft;
  // gridDistance = how many ft per grid square (usually 5)
  const gridDistance = scene.grid?.distance ?? 5;
  return (ft / gridDistance);
}

// ── BUILD TOKEN LIGHT UPDATE ──────────────────────────────────────────────────
function buildLightUpdate(source) {
  if (source.id === "none") {
    return {
      "light.dim":    0,
      "light.bright": 0,
      "light.alpha":  0,
      "light.animation": { type: "none", speed: 0, intensity: 0 },
    };
  }

  return {
    "light.dim":    ftToUnits(source.dim),
    "light.bright": ftToUnits(source.bright),
    "light.color":  source.color,
    "light.alpha":  source.alpha,
    "light.angle":  source.angle,
    "light.animation": {
      type:      source.animation.type,
      speed:     source.animation.speed,
      intensity: source.animation.intensity,
    },
  };
}

// ── APPLICATION CLASS ─────────────────────────────────────────────────────────

class LightSourceApp extends Application {

  constructor(token, options = {}) {
    super(options);
    this.token = token;  // The TokenDocument
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:       "vlm-light-gui",
      title:    "Light & Vision",
      template: `modules/${MODULE_ID}/templates/light-gui.html`,
      width:    420,
      height:   "auto",
      resizable: false,
      classes:  ["vlm-app"],
    });
  }

  getData() {
    // Find currently active light source by comparing dim radius
    const currentDim = this.token.light?.dim ?? 0;
    const currentBright = this.token.light?.bright ?? 0;

    // Get senses from the actor for the display panel
    const actor  = this.token.actor;
    const senses = actor ? game.modules.get(MODULE_ID).api.getSensesFromActor(actor) : {};

    // Determine active source id
    let activeId = "none";
    for (const src of LIGHT_SOURCES) {
      if (src.id === "none") continue;
      if (
        Math.abs(ftToUnits(src.dim)    - currentDim)    < 0.5 &&
        Math.abs(ftToUnits(src.bright) - currentBright) < 0.5
      ) {
        activeId = src.id;
        break;
      }
    }

    return {
      sources:    LIGHT_SOURCES,
      activeId,
      senses,
      tokenName:  this.token.name,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Light source card click
    html.find(".vlm-source-card").click(async (ev) => {
      const id     = ev.currentTarget.dataset.id;
      const source = LIGHT_SOURCES.find(s => s.id === id);
      if (!source) return;

      const update = buildLightUpdate(source);

      try {
        await this.token.update(update);
        ui.notifications.info(
          source.id === "none"
            ? `${this.token.name} extinguishes their light.`
            : `${this.token.name} equips: ${source.label}.`
        );
        // Re-render to update active state
        this.render(false);
      } catch(e) {
        ui.notifications.error("Failed to update token light.");
        console.error(`${MODULE_ID} |`, e);
      }
    });

    // Re-sync vision button
    html.find("#vlm-sync-vision").click(async () => {
      const actor = this.token.actor;
      if (!actor) return;
      await game.modules.get(MODULE_ID).api.applyVisionToActor(actor);
      ui.notifications.info(`Vision re-synced for ${actor.name}.`);
      this.render(false);
    });
  }
}

// ── SIDEBAR BUTTON ────────────────────────────────────────────────────────────
// Uses the same direct DOM injection on ready that works in the quest board.
// Targets #sidebar-tabs menu directly — confirmed working in this Foundry build.

Hooks.once("ready", () => {
  const api = game.modules.get(MODULE_ID).api ?? {};

  // ── openLightGui helper ──
  api.openLightGui = function(actorOrToken) {
    let tokenDoc;
    if (actorOrToken instanceof TokenDocument) {
      tokenDoc = actorOrToken;
    } else if (actorOrToken instanceof Actor) {
      tokenDoc = canvas.tokens.placeables.find(t => t.actor?.id === actorOrToken.id)?.document;
    } else {
      tokenDoc = canvas.tokens.controlled[0]?.document;
    }
    if (!tokenDoc) {
      ui.notifications.warn("No token found. Select a token first.");
      return;
    }
    new LightSourceApp(tokenDoc).render(true);
  };

  game.modules.get(MODULE_ID).api = api;

  // ── Inject sidebar button ──
  if (document.querySelector("#vlm-sidebar-btn")) return;

  const menu = document.querySelector("#sidebar-tabs menu");
  if (!menu) {
    console.warn(`${MODULE_ID} | Could not find #sidebar-tabs menu — button not injected.`);
    return;
  }

  const li = document.createElement("li");
  li.innerHTML = `
    <button type="button"
            id="vlm-sidebar-btn"
            class="ui-control plain icon fa-solid fa-fire"
            title="Light &amp; Vision"
            aria-label="Light &amp; Vision"
            data-tooltip="Light &amp; Vision">
    </button>
  `;

  li.querySelector("button").addEventListener("click", () => {
    // GM: open for selected token, any character
    // Player: open for their own selected token
    const token = canvas.tokens.controlled[0];
    if (!token) {
      ui.notifications.warn("Select a token first.");
      return;
    }
    if (token.actor?.type !== "character") {
      ui.notifications.warn("Selected token must be a character.");
      return;
    }
    new LightSourceApp(token.document).render(true);
  });

  menu.appendChild(li);
  console.log(`${MODULE_ID} | Sidebar button injected.`);
});
