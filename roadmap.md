# Current corrections
- [ ] Fix viewing, reducing and removing project time entries from past-day cells.
- [ ] Collapse entity descriptions to two lines before expansion.
- [ ] Reposition public copy and search metadata as a journal app in all supported languages.

# Brain-shaped 3D graph
- [x] Keep interaction quality stable and add smoother, gently pulsing graph nodes; isolated desktop/mobile browser checks confirmed constant DPR, advancing pulse and reduced-motion support.
- [ ] Verify graph changes with a signed-in account (blocked: no authenticated session available); geometry suite has a pre-existing surface-bound assertion failure (-2.958 vs -3).
- [ ] Enable Adaptive Pricing for Checkout Elements in Stripe Dashboard and verify localized subscription prices match the embedded checkout across supported countries.
- [x] Restyle account emails with flat app colors/fonts and favicon; welcome trigger confirmed, 7 isolated tests passed and browser rendering verified (live delivery not tested; full Maven suite blocked by unrelated stale tests).
- [x] Convert mobile Notes filters to SmoothDrawer and open graph details compactly with drag-to-expand (3 tests passed, build OK; authenticated gesture verification unavailable).
- [x] Align desktop Notes, Entities and Vault search/filter styling with mobile; add manually toggled right Notes sidebar (tests passed; signed-in visual check unavailable).
- [ ] Build a volumetric brain network with real graph nodes and connections.
- [ ] Integrate rotation, interior navigation, node selection and existing filters.
- [ ] Verify layout, geometry tests and browser interaction.

# Capture and export corrections
- [ ] Tighten remaining import false positives from sentence/list starts, common verbs and weak standalone name fragments; preserve explicit references and genuine names.
- [x] Apply proper-name and boundary filters, overlapping-fragment suppression, and precise project context; 19 isolated import tests passed (standard Maven test compilation blocked by unrelated stale tests); live import awaits backend deployment.
- [x] Fix exported note filenames and convert note bodies to Markdown without frontmatter; 4 focused Java tests passed, including the supplied note.
- [x] Remove weekly review and limit quick capture to the Notes search toolbar.
- [x] Add a visible ZIP download action to Settings, retaining existing export entitlement.
- [x] Validate capture saving and removed weekly shortcut in tests; build OK.
- [ ] Verify ZIP download and Notes placement with a signed-in account (blocked: preview redirects to the public page).
