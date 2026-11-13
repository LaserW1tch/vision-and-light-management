/**
 * light-gui.js
 * Provides a styled dialog that lets players quickly equip a light source.
 * Keep the module identifier local so another module cannot shadow it.
 */

(() => {
const VISION_LIGHT_MANAGER_GUI_ID = "vision-light-manager";


// ── LIGHT SOURCE DEFINITIONS ──────────────────────────────────────────────────
// Preset ranges use feet; scenes should use feet as their distance unit.
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
    controlFlames: true,
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
    controlFlames: true,
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
    controlFlames: true,
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
    controlFlames: true,
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
    controlFlames: true,
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
    controlFlames: true,
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

// ── LIGHT RANGE UNITS ────────────────────────────────────────────────────────
// Foundry stores token light radii in the Scene's configured distance units.
// This module's presets are in feet, so write feet directly (e.g. 20/40).
function ftToSceneUnits(ft) {
  return Number.isFinite(ft) ? ft : 0;
}

// ── BUILD TOKEN LIGHT UPDATE ──────────────────────────────────────────────────
function buildLightUpdate(source, doubleRanges = false) {
  if (source.id === "none") {
    return {
      "light.dim":    0,
      "light.bright": 0,
      "light.alpha":  0,
      "light.animation": { type: "none", speed: 0, intensity: 0 },
    };
  }

  return {
    "light.dim":    ftToSceneUnits(source.dim * (doubleRanges ? 2 : 1)),
    "light.bright": ftToSceneUnits(source.bright * (doubleRanges ? 2 : 1)),
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

function getControlFlamesEffect(token) {
  return token.getFlag?.(VISION_LIGHT_MANAGER_GUI_ID, "controlFlames") ?? null;
}

async function expireControlFlames(worldTime = game.time.worldTime) {
  if (!game.user.isGM || !Number.isFinite(worldTime)) return;
  for (const scene of game.scenes) {
    for (const token of scene.tokens) {
      const effect = getControlFlamesEffect(token);
      if (!effect || effect.expiresAt > worldTime) continue;
      await token.update({
        "light.bright": effect.baseBright,
        "light.dim": effect.baseDim,
        [`flags.${VISION_LIGHT_MANAGER_GUI_ID}.-=controlFlames`]: null,
      });
    }
  }
}

// ── APPLICATION CLASS ─────────────────────────────────────────────────────────

class LightSourceApp extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "vlm-light-gui",
    classes: ["vlm-app"],
    window: { title: "Light & Vision" },
    position: { width: 420 },
  };

  static PARTS = {
    main: { template: `modules/${VISION_LIGHT_MANAGER_GUI_ID}/templates/light-gui.html` },
  };

  constructor(token, options = {}) {
    super(options);
    this.token = token;
    this.selectedLightSourceId = null;
    this.controlFlamesActive = false;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const currentDim = this.token.light?.dim ?? 0;
    const currentBright = this.token.light?.bright ?? 0;
    const api = game.modules.get(VISION_LIGHT_MANAGER_GUI_ID)?.api;
    const actor = this.token.actor;
    const senses = actor && typeof api?.getSensesFromActor === "function"
      ? api.getSensesFromActor(actor)
      : {};

    const matchingSources = LIGHT_SOURCES.filter(source => source.id !== "none" && (
      (Math.abs(ftToSceneUnits(source.dim) - currentDim) < 0.5 &&
        Math.abs(ftToSceneUnits(source.bright) - currentBright) < 0.5) ||
      (source.controlFlames &&
        Math.abs(ftToSceneUnits(source.dim * 2) - currentDim) < 0.5 &&
        Math.abs(ftToSceneUnits(source.bright * 2) - currentBright) < 0.5)
    ));
    const currentColor = this.token.light?.color?.toString().toLowerCase();
    const activeSource = matchingSources.find(source =>
      source.color.toLowerCase() === currentColor &&
      source.angle === (this.token.light?.angle ?? 360)
    ) ?? matchingSources[0];
    const activeId = this.selectedLightSourceId ?? activeSource?.id ?? "none";
    const effect = getControlFlamesEffect(this.token);
    const hasActiveControlFlames = Boolean(effect && effect.expiresAt > game.time.worldTime);
    const canControlFlames = Boolean(activeSource?.controlFlames);
    this.controlFlamesActive = hasActiveControlFlames && canControlFlames;

    return {
      ...context,
      sources: LIGHT_SOURCES.map(source => ({
        ...source,
        isActive: source.id === activeId,
      })),
      senses,
      tokenName: this.token.name,
      canControlFlames,
      controlFlamesActive: this.controlFlamesActive,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this._clickController?.abort();
    this._clickController = new AbortController();
    this.element.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target : event.target?.parentElement;
      const card = target?.closest(".vlm-source-card");
      if (card) void this.#equipLight(card.dataset.id);
      if (target?.closest("#vlm-sync-vision")) void this.#syncVision();
    }, { signal: this._clickController.signal });
    this.element.addEventListener("change", event => {
      if (event.target?.id === "vlm-control-flames") {
        void this.#setControlFlames(event.target.checked);
      }
    }, { signal: this._clickController.signal });
  }

  async #equipLight(id) {
    const source = LIGHT_SOURCES.find(candidate => candidate.id === id);
    if (!source) return;
    const doubleRanges = Boolean(this.controlFlamesActive && source.controlFlames);
    try {
      const update = buildLightUpdate(source, doubleRanges);
      if (doubleRanges) {
        update[`flags.${VISION_LIGHT_MANAGER_GUI_ID}.controlFlames`] = {
          baseBright: source.bright,
          baseDim: source.dim,
          expiresAt: game.time.worldTime + 3600,
        };
      } else {
        update[`flags.${VISION_LIGHT_MANAGER_GUI_ID}.-=controlFlames`] = null;
      }
      await this.token.update(update);
      this.selectedLightSourceId = source.id;
      ui.notifications.info(
        source.id === "none"
          ? `${this.token.name} extinguishes their light.`
          : `${this.token.name} equips: ${source.label}.`
      );
      await this.render();
    } catch (error) {
      ui.notifications.error("Failed to update token light.");
      console.error(`${VISION_LIGHT_MANAGER_GUI_ID} |`, error);
    }
  }

  async #setControlFlames(enabled) {
    const effect = getControlFlamesEffect(this.token);
    const source = LIGHT_SOURCES.find(candidate => candidate.id === this.selectedLightSourceId) ??
      LIGHT_SOURCES.find(candidate => candidate.controlFlames &&
        Math.abs(candidate.dim * (effect ? 2 : 1) - (this.token.light?.dim ?? 0)) < 0.5 &&
        Math.abs(candidate.bright * (effect ? 2 : 1) - (this.token.light?.bright ?? 0)) < 0.5);
    if (!source?.controlFlames) return;

    try {
      const update = buildLightUpdate(source, enabled);
      if (enabled) {
        update[`flags.${VISION_LIGHT_MANAGER_GUI_ID}.controlFlames`] = {
          baseBright: source.bright,
          baseDim: source.dim,
          expiresAt: game.time.worldTime + 3600,
        };
      } else {
        update[`flags.${VISION_LIGHT_MANAGER_GUI_ID}.-=controlFlames`] = null;
      }
      await this.token.update(update);
      this.controlFlamesActive = enabled;
      await this.render();
    } catch (error) {
      ui.notifications.error("Failed to update token light.");
      console.error(`${VISION_LIGHT_MANAGER_GUI_ID} |`, error);
    }
  }

  async #syncVision() {
    const actor = this.token.actor;
    if (!actor) return;
    const applyVision = game.modules.get(VISION_LIGHT_MANAGER_GUI_ID)?.api?.applyVisionToActor;
    if (typeof applyVision !== "function") {
      ui.notifications.error("Vision sync is not ready. Reload the world and try again.");
      return;
    }
    try {
      await applyVision(actor);
      ui.notifications.info(`Vision re-synced for ${actor.name}.`);
      await this.render();
    } catch (error) {
      ui.notifications.error("Failed to re-sync vision. Check the console for details.");
      console.error(`${VISION_LIGHT_MANAGER_GUI_ID} | Vision sync failed:`, error);
    }
  }
}

// ── SIDEBAR BUTTON ────────────────────────────────────────────────────────────
// Uses the same direct DOM injection on ready that works in the quest board.
// Targets #sidebar-tabs menu directly — confirmed working in this Foundry build.

Hooks.once("ready", () => {
  const api = game.modules.get(VISION_LIGHT_MANAGER_GUI_ID).api ?? {};
  void expireControlFlames();
  Hooks.on("updateWorldTime", worldTime => void expireControlFlames(worldTime));

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
    if (!game.user.isGM && !tokenDoc.actor?.isOwner) {
      ui.notifications.warn(game.i18n.localize("VLM.Errors.NoPermission"));
      return;
    }
    new LightSourceApp(tokenDoc).render({ force: true });
  };

  game.modules.get(VISION_LIGHT_MANAGER_GUI_ID).api = api;

  // ── Inject sidebar button ──
  if (document.querySelector("#vlm-sidebar-btn")) return;

  const menu = document.querySelector("#sidebar-tabs menu");
  if (!menu) {
    console.warn(`${VISION_LIGHT_MANAGER_GUI_ID} | Could not find #sidebar-tabs menu — button not injected.`);
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
    api.openLightGui(token.document);
  });

  menu.appendChild(li);
  console.log(`${VISION_LIGHT_MANAGER_GUI_ID} | Sidebar button injected.`);
});
})();
