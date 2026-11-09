# Changelog

## 1.1.0

- Read D&D 5e sense values from the modern `senses.ranges` data path, with fallback support for older versions.
- Restrict automatic world-load and actor-update synchronization to the GM client to prevent duplicate writes from player clients.
- Use module-specific identifiers so other modules cannot redirect template or API lookups.
- Verify the module in Foundry VTT 14.367 with D&D 5e 6.0.6 in the local testbed.
- Store D&D 5e vision ranges in Scene distance units and correct light presets to use feet directly.
- Preserve detection modes owned by other modules when synchronizing vision.
- Keep the selected light highlighted after equipping it, and identify presets more reliably when reopening the panel.
- Migrate the light panel to ApplicationV2 and isolate script variables to prevent global name collisions.
- Improve sync error feedback and update installation instructions and release metadata.
