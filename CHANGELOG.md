# Changelog

## 1.2.1

- Update the user-visible module name to `LaserW1tch's Vision & Light Manager 5e`.

## 1.2.0

- Add a Control Flames toggle for doubling bright- and dim-light ranges on nonmagical flame presets for one hour of world time.
- Expire the doubled ranges and restore their prior radii when world time advances past the effect duration.

## 1.1.0

- Read D&D 5e sense values from the modern `senses.ranges` data path, with fallback support for older versions.
- Restrict automatic world-load and actor-update synchronization to the GM client to prevent duplicate writes from player clients.
- Use module-specific identifiers so other modules cannot redirect template or API lookups.
- Verify the module in Foundry VTT 14.367 with D&D 5e 6.0.6 in the local testbed.
- Confirm the 60 ft darkvision boundary at 55 ft and 65 ft on a straight grid axis, and verify Torch stores 20/40 ft on a 5 ft scene grid.
- Confirm installation through the published Forge manifest link.
- Store D&D 5e vision ranges in Scene distance units and correct light presets to use feet directly.
- Preserve detection modes owned by other modules when synchronizing vision.
- Keep the selected light highlighted after equipping it, and identify presets more reliably when reopening the panel.
- Migrate the light panel to ApplicationV2 and isolate script variables to prevent global name collisions.
- Improve sync error feedback and update installation instructions and release metadata.
