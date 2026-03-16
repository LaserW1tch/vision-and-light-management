/**
 * vision-sync.js
 * Reads DnD5e senses from a player-owned actor and applies
 * them to that actor's prototype token (and any active tokens).
 *
 * Runs on:
 *   - "ready"           (world load)
 *   - "updateActor"     (whenever a character sheet is saved/updated)
 */

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const MODULE_ID = "vision-light-manager";

/**
 * Maps dnd5e sense keys to Foundry V13 token sight/detection fields.
 *
 * Foundry V13 token vision model:
 *   token.sight.range      – how far the token can see in darkness (darkvision)
 *   token.sight.visionMode – vision mode id string
 *   token.detectionModes   – array of { id, enabled, range } objects
 *
 * Detection mode ids (core V13 + dnd5e system):
 *   "basicSight"      – normal sight
 *   "seeInvisibility" – see invisible
 *   "blindsight"      – blindsight
 *   "tremorsense"     – tremorsense
 *   "truesight"       – truesight
 */
const SENSE_MAP = {
  darkvision:  { type: "sight",     modeId: "darkvision"  },
  blindsight:  { type: "detection", modeId: "blindsight"  },
  truesight:   { type: "detection", modeId: "truesight"   },
  tremorsense: { type: "detection", modeId: "tremorsense" },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Read all relevant senses from a dnd5e actor.
 * Returns an object like: { darkvision: 60, blindsight: 0, truesight: 30, tremorsense: 0 }
 */
function getSensesFromActor(actor) {
  const senses = actor.system?.attributes?.senses ?? {};
  return {
    darkvision:  Number(senses.darkvision  ?? 0),
    blindsight:  Number(senses.blindsight  ?? 0),
    truesight:   Number(senses.truesight   ?? 0),
    tremorsense: Number(senses.tremorsense ?? 0),
  };
}

/**
 * Convert feet to Foundry V13 grid units.
 * sight.range and detectionModes[].range must be in grid units, not feet.
 * Standard 5e: 1 square = 5ft, so 60ft darkvision = 12 grid units.
 */
function ftToGridUnits(ft) {
  if (!ft || ft === 0) return 0;
  const scene = game.scenes?.active;
  const gridDistance = scene?.grid?.distance ?? 5;
  return ft / gridDistance;
}

/**
 * Build the token update data object from extracted senses.
 * Uses nested object syntax (not dot-notation strings) for sight and
 * detectionModes — required for Foundry V13 to apply these correctly.
 */
function buildTokenVisionUpdate(senses) {

  // ── Sight (darkvision) ───────────────────────────────────────────────────
  const sight = {
    enabled:    true,
    range:      ftToGridUnits(senses.darkvision),
    visionMode: senses.darkvision > 0 ? "darkvision" : "basic",
  };

  // ── Detection modes ──────────────────────────────────────────────────────
  const detectionModes = [
    {
      id:      "basicSight",
      enabled: true,
      range:   ftToGridUnits(senses.darkvision > 0 ? senses.darkvision : 30),
    }
  ];

  if (senses.blindsight > 0) {
    detectionModes.push({ id: "blindsight",  enabled: true, range: ftToGridUnits(senses.blindsight) });
  }
  if (senses.truesight > 0) {
    detectionModes.push({ id: "truesight",   enabled: true, range: ftToGridUnits(senses.truesight) });
  }
  if (senses.tremorsense > 0) {
    detectionModes.push({ id: "tremorsense", enabled: true, range: ftToGridUnits(senses.tremorsense) });
  }

  return { sight, detectionModes };
}

/**
 * Apply vision update to the actor's prototype token and all
 * currently placed tokens on the canvas that reference this actor.
 */
async function applyVisionToActor(actor) {
  // Only process player characters
  if (actor.type !== "character") return;
  // Only process actors owned by a player (not just GM-owned)
  if (!actor.hasPlayerOwner) return;

  const senses   = getSensesFromActor(actor);
  const tokenUpd = buildTokenVisionUpdate(senses);

  // ── Update prototype token ───────────────────────────────────────────────
  try {
    await actor.update({ prototypeToken: tokenUpd });
  } catch(e) {
    console.warn(`${MODULE_ID} | Failed to update prototype token for ${actor.name}:`, e);
  }

  // ── Update any live tokens on the canvas ─────────────────────────────────
  if (!canvas?.ready) return;

  const liveTokens = canvas.tokens.placeables.filter(t => t.actor?.id === actor.id);
  for (const token of liveTokens) {
    try {
      await token.document.update(tokenUpd);
    } catch(e) {
      console.warn(`${MODULE_ID} | Failed to update live token for ${actor.name}:`, e);
    }
  }

  const sensesSummary = Object.entries(senses)
    .filter(([,v]) => v > 0)
    .map(([k,v]) => `${k} ${v}ft`)
    .join(", ") || "none";

  console.log(`${MODULE_ID} | Synced vision for "${actor.name}": ${sensesSummary}`);
}

/**
 * Iterate all player-owned characters in the world and sync them.
 */
async function syncAllPlayerActors() {
  const allActors = game.actors?.contents ?? [];
  console.log(`${MODULE_ID} | Total actors in world: ${allActors.length}`);

  const playerActors = allActors.filter(a => {
    const isChar = a.type === "character";
    const hasOwner = a.hasPlayerOwner;
    console.log(`${MODULE_ID} |   "${a.name}" — type: ${a.type}, hasPlayerOwner: ${hasOwner}`);
    return isChar && hasOwner;
  });

  for (const actor of playerActors) {
    await applyVisionToActor(actor);
  }
  console.log(`${MODULE_ID} | Vision sync complete for ${playerActors.length} actor(s).`);
}

// ── HOOKS ─────────────────────────────────────────────────────────────────────

/**
 * On world ready — wait for dnd5e to finish its own setup before syncing.
 * dnd5e 5.x fires a "dnd5e.ready" hook after its own initialization;
 * we listen for that first, then fall back to a longer delay if it
 * doesn't fire (e.g. on older sub-versions).
 */
Hooks.once("ready", async () => {
  console.log(`${MODULE_ID} | World ready — waiting for dnd5e to initialize...`);

  // Debug: log what actors exist right now
  console.log(`${MODULE_ID} | Actors at ready:`, game.actors?.contents?.map(a =>
    `${a.name} (${a.type}, hasPlayerOwner: ${a.hasPlayerOwner})`
  ));

  // dnd5e 5.x fires this hook after its own ready setup
  const dnd5eReady = new Promise(resolve => {
    // If dnd5e.ready fires, resolve immediately
    Hooks.once("dnd5e.ready", () => {
      console.log(`${MODULE_ID} | dnd5e.ready fired — running vision sync.`);
      resolve();
    });
    // Safety fallback: wait 2 seconds regardless
    setTimeout(resolve, 2000);
  });

  await dnd5eReady;
  await syncAllPlayerActors();
});

/**
 * On actor update — re-sync if the updated actor is a player character.
 * The hook fires as: (actor, changes, options, userId)
 * We only care if the "system.attributes.senses" path changed.
 */
Hooks.on("updateActor", async (actor, changes, _options, _userId) => {
  // Only react to changes that touch senses
  const sensesChanged = foundry.utils.hasProperty(changes, "system.attributes.senses");
  if (!sensesChanged) return;

  console.log(`${MODULE_ID} | Senses changed on "${actor.name}" — re-syncing vision.`);
  await applyVisionToActor(actor);
});

/**
 * Expose helpers on the module namespace for use by light-gui.js
 */
Hooks.once("init", () => {
  game.modules.get(MODULE_ID).api = {
    applyVisionToActor,
    syncAllPlayerActors,
    getSensesFromActor,
    buildTokenVisionUpdate,
  };
});
