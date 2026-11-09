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

(() => {
const VISION_LIGHT_MANAGER_MODULE_ID = "vision-light-manager";

/**
 * Maps dnd5e sense keys to Foundry token sight/detection fields.
 *
 * Foundry V13+ token vision model:
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
// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Read all relevant senses from a dnd5e actor. D&D 5e 5.3 moved the numeric
 * ranges to system.attributes.senses.ranges; older releases expose them
 * directly under system.attributes.senses.
 * Returns an object like: { darkvision: 60, blindsight: 0, truesight: 30, tremorsense: 0 }
 */
function getSensesFromActor(actor) {
  const senses = actor.system?.attributes?.senses ?? {};
  const ranges = senses.ranges;
  const readRange = key => {
    // Avoid the deprecated legacy accessors when the modern range object exists.
    const raw = ranges ? (ranges[key] ?? 0) : (senses[key] ?? 0);
    const value = typeof raw === "object" && raw !== null
      ? Number(raw.value ?? raw.range ?? 0)
      : Number(raw);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  };
  return {
    darkvision:  readRange("darkvision"),
    blindsight:  readRange("blindsight"),
    truesight:   readRange("truesight"),
    tremorsense: readRange("tremorsense"),
  };
}

/**
 * Foundry sight and detection ranges use the Scene's distance units.
 * The module currently reads D&D 5e ranges in feet, so store those values
 * directly when the Scene is configured in feet (the supported setup).
 */
function ftToDistanceUnits(ft) {
  return Number.isFinite(ft) ? ft : 0;
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
    range:      ftToDistanceUnits(senses.darkvision),
    visionMode: senses.darkvision > 0 ? "darkvision" : "basic",
  };

  // ── Detection modes ──────────────────────────────────────────────────────
  const detectionModes = [
    {
      id:      "basicSight",
      enabled: true,
      // Let core Basic Sight follow the token's vision settings and see
      // illuminated targets beyond darkvision's range.
      range:   null,
    }
  ];

  if (senses.blindsight > 0) {
    detectionModes.push({ id: "blindsight",  enabled: true, range: ftToDistanceUnits(senses.blindsight) });
  }
  if (senses.truesight > 0) {
    detectionModes.push({ id: "truesight",   enabled: true, range: ftToDistanceUnits(senses.truesight) });
  }
  if (senses.tremorsense > 0) {
    detectionModes.push({ id: "tremorsense", enabled: true, range: ftToDistanceUnits(senses.tremorsense) });
  }

  return { sight, detectionModes };
}

/** Replace only the detection modes managed here; retain other modules' modes. */
function mergeDetectionModes(existingModes = [], managedModes = []) {
  const managedIds = new Set(["basicSight", "blindsight", "truesight", "tremorsense"]);
  const preserved = (existingModes ?? []).filter(mode => !managedIds.has(mode.id));
  return [...preserved, ...managedModes];
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
    const existingModes = actor.prototypeToken?.detectionModes ?? [];
    await actor.update({ prototypeToken: {
      ...tokenUpd,
      detectionModes: mergeDetectionModes(existingModes, tokenUpd.detectionModes),
    } });
  } catch(e) {
    console.warn(`${VISION_LIGHT_MANAGER_MODULE_ID} | Failed to update a prototype token:`, e);
  }

  // ── Update any live tokens on the canvas ─────────────────────────────────
  if (!canvas?.ready) return;

  const liveTokens = canvas.tokens.placeables.filter(t => t.actor?.id === actor.id);
  for (const token of liveTokens) {
    try {
      const liveUpdate = {
        ...tokenUpd,
        detectionModes: mergeDetectionModes(token.document.detectionModes, tokenUpd.detectionModes),
      };
      await token.document.update(liveUpdate);
    } catch(e) {
      console.warn(`${VISION_LIGHT_MANAGER_MODULE_ID} | Failed to update a live token:`, e);
    }
  }

}

/**
 * Iterate all player-owned characters in the world and sync them.
 */
async function syncAllPlayerActors() {
  const allActors = game.actors?.contents ?? [];
  const playerActors = allActors.filter(a => a.type === "character" && a.hasPlayerOwner);

  for (const actor of playerActors) {
    await applyVisionToActor(actor);
  }
}

// ── HOOKS ─────────────────────────────────────────────────────────────────────

/**
 * Expose helpers before light-gui.js installs its ready-time button handler.
 * Registering on ready avoids depending on the module script loading phase
 * relative to Foundry's init hook.
 */
Hooks.once("ready", () => {
  game.modules.get(VISION_LIGHT_MANAGER_MODULE_ID).api = {
    applyVisionToActor,
    syncAllPlayerActors,
    getSensesFromActor,
    buildTokenVisionUpdate,
  };
});

/**
 * On world ready — wait for dnd5e to finish its own setup before syncing.
 * dnd5e 5.x fires a "dnd5e.ready" hook after its own initialization;
 * we listen for that first, then fall back to a longer delay if it
 * doesn't fire (e.g. on older sub-versions).
 */
Hooks.once("ready", async () => {
  // Run automatic world-wide writes once from the GM client, not once per
  // connected player client.
  if (!game.user.isGM) return;
  console.log(`${VISION_LIGHT_MANAGER_MODULE_ID} | World ready — waiting for dnd5e to initialize...`);

  // Debug: log what actors exist right now
  // dnd5e 5.x fires this hook after its own ready setup
  const dnd5eReady = new Promise(resolve => {
    // If dnd5e.ready fires, resolve immediately
    Hooks.once("dnd5e.ready", () => {
      console.log(`${VISION_LIGHT_MANAGER_MODULE_ID} | dnd5e.ready fired — running vision sync.`);
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
  // The GM is the authoritative writer for automatic vision synchronization.
  if (!game.user.isGM) return;
  // Only react to changes that touch senses
  const sensesChanged = foundry.utils.hasProperty(changes, "system.attributes.senses");
  if (!sensesChanged) return;

  await applyVisionToActor(actor);
});
})();
