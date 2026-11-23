Changelog

Every notable change to Continuum, from the first release to the latest version. Newest releases are listed first.

---

v1.4.2 — Nov 23, 2026

- Notes: Added a daily review drawer that resurfaces one old note per day using spaced repetition (7 → 30 → 90 → 180 days), with a preview, its connected entities, and quick actions to open, keep relevant, skip or stop suggesting it.
- Notes: Added open-loops detection that finds unfinished checklists, unanswered questions and thoughts marked TODO/DÚVIDA/IDEIA/DECIDIR older than 7 days, with actions to open, snooze for 14 days or mark as solved.
- Editor: Added a /lembrar time capsule command (e.g. /lembrar 30d, 3m or a date) that reopens the message on the scheduled day in the daily review.
- Entities: Added an "Often appears with" section showing entities that co-occur in the same notes, with a click to list the notes where both appear.
- Editor: Added a side panel resurfacing older notes that share the same entities as the one being written.
- Settings: Added a switch to turn the daily review on or off.

---

v1.4.1 — Nov XX, 2026

- Workspaces: Switching workspaces now refreshes the app automatically (web, PWA and Android app).
- Search: Notes are now found by mentioned entities (with or without @).
- Editor: Copying text no longer adds piles of blank lines and keeps @mentions readable.
- Android: Improved returning to the app after Google sign-in, with a manual "Open Continuum" button fallback.
- Notes: Fixed opening a note changing its "last modified" date even without any edits.
- Editor: Pasted Markdown text is now recognized and converted to formatted content automatically.
- Insights: Added a daily Memories feed resurfacing noteworthy notes at 1, 3, and 6-month milestones and yearly anniversaries, with excerpt and photo preview.
- Email: Added a daily memories email (max one per day) with an inline photo preview, excerpt, and a button to open the note.
- Insights: Fixed signal category filters showing incorrect or duplicated results.
- Notes: Calibrated the "worth revisiting" algorithm with an adaptive time window (7 days for new vaults, 21 days for mature ones), stricter relevance criteria, a 15% cap, and badge expiration.
- Dates: Fixed dates displaying in American format regardless of the user's language; date fields and calendars now follow the app language.
- Dates: Fixed dates shifting one day back in negative timezones.
- Billing: Fixed the Vision price taking too long or failing to display; the localized price now loads in the background and is remembered between visits.
- Billing: Fixed the price area for current Vision subscribers, showing the plan status instead of a loading spinner.
- Workspaces: Fixed a generic error when hitting the workspace limit; the Free plan limit message is now shown correctly.
- Workspaces: Fixed stale data from the previous workspace appearing after switching.
- Workspaces: Redesigned the workspace picker popup with overlay and scrollable list.
- Workspaces: Added rename and delete actions to the workspace picker on desktop and mobile.
- Workspaces: Added bulk actions to add selected notes and entities to a workspace or move them there.
- Performance: The app now loads only essential data after login instead of hundreds of simultaneous requests.
- Performance: Eliminated typing and scrolling stutters caused by excessive cache writes.
- Performance: Heavy screens (3D graph, editor, insights) and the landing page now load only when opened.

---

v1.4.0 — Oct 31, 2026

- Workspaces: Added workspace system to separate notes, entities, and projects into isolated environments (BETA).
- Workspaces: Notes and entities can be assigned to one or multiple workspaces, with automatic inheritance during creation.
- Workspaces: Added unified "All" view to browse all knowledge seamlessly across spaces.
- Workspaces: Isolated 3D Knowledge Graph, global search, @mention autocomplete, backlinks, insights, and daily recall by active workspace.
- Workspaces: Safe workspace deletion reassigns exclusive items back to Main with zero data loss.
- UI: Enchance entity details screen, Enchance entity creation button.

---

v1.3.4 — Oct 21, 2026

- Import: Preserved source file modification dates and automatically imported and linked supported Vault files referenced by Markdown notes.
- Settings: Consolidated data export into the full ZIP backup download.
- Quick Capture: Added a press button and Ctrl+Shift+N shortcut to create a note instantly without opening the editor.
- UI: Enchance /projects and /activities pages.
- Projects: Added editable time-entry history to project details so tracked durations can be reduced.
- Activities: Added an button to edit existing entries.
- Graph: Focus mode now supports 1st- or 2nd-degree connection depth.
- Notes: Fixed stale or invalid cached note data preventing the editor from loading; added retry and back navigation when loading fails.
- 3D Graph: Improved node rendering and interaction stability with GPU-animated pulses.

---

v1.3.3 — Oct 13, 2026

- UI: Padronize /notes, /entities UI in desktop to look like mobile.
- Notes: Filter by type now uses drawer.
- Billing: Enabled Stripe Adaptive Pricing for embedded subscription checkout.
- Billing: Added an in-app Stripe checkout experience.

---

v1.3.2 — Oct 11, 2026

- UI: Introduced charcoal and light themes.
- UI: Polished drawer component
- 3D Graph: Add a 3D graph in brain shape (beta).
- Backend: Added email infrastructure.
- Email: Added an alert-sending service.
- Time Tracking: Preserved scroll-wheel duration controls on mobile and added numeric inputs for setting goals and adding manual entries on desktop.
- Notes: Fixed bilink navigation to open the correct note and save pending edits before leaving.
- Import: Improved entity detection to include only entities mentioned at least twice.

---

v1.3.1 — Oct 08, 2026

- Performance: Reduced startup delays when opening the app.
- Performance: Fixed scrolling issues across the app.
- Notes & Vault: Improved PDF rendering inside notes and the Vault.
- Trash: Added a trash system for deleted notes and entities, including restoration.
- Notes: Added image resizing.
- Limits: Added usage limit alerts.
- Projects & Activities: Added support for recording past entries.
- Account: Added self-service account deletion.
- Vault: Notes can now use files already stored in the Vault.
- UI: Polished the note index, note/entity selection, mention selector, subscription banner, Settings, entity details, and notification banners.

---

v1.3.0 — Sep 25, 2026

- UI/UX: Refined the overall interface and user experience.
- Settings: Replaced "/profile" with "/settings" and redesigned the Settings experience.
- Navigation: Improved the mobile bottom navigation.
- Subscriptions: Refined the subscription experience.
- Performance: Added caching to improve loading speed and responsiveness.
- Search: Added note search on both mobile and desktop.
- Editor: Fixed Markdown rendering when changing body text size.

---

v1.2.16 — Sep 13, 2026

- Mobile: Added the first Android app build using Capacitor.
- Navigation: Removed the "/" route from the Dashboard.

---

v1.2.15 — Aug 29, 2026

- Backend: Refined environment and backend configuration.

---

v1.2.12 — Aug 30, 2026

- Editor: Refined the note editor and its styling.

---

v1.2.11 — Aug 30, 2026

- UI: Added minor visual refinements across the app.

---

v1.2.10 — Aug 30, 2026

- Profile: Continued improvements to profile wallpapers.
- Editor: Refined editor font sizing.

---

v1.2.9 — Aug 30, 2026

- Editor: Added adjustable font sizes to the note editor.
- Profile: Added related editor preferences to Profile.

---

v1.2.8 — Aug 30, 2026

- Authentication: Reworked sign-in and sign-up redirects.
- Routing: Fixed navigation issues across several pages.
- Free Plan: Adjusted free plan limits.
- Data Export: Made data export available exclusively to paid plans.
- Backend: Removed a leftover static Google authentication file from the build.

---

v1.2.6 — Aug 26, 2026

- Notifications: Migrated notifications from Discord to Telegram.
- Performance: Improved page transitions and loading animations.
- Profile: Added new wallpaper customization options.
- Notes: Rebuilt the note editor and Notes page for a better writing experience.
- UI: Refined the Dashboard, Entities, Insights, and Vault pages.

---

v1.2.5 — Aug 10, 2026

- Backend: Refined environment configuration.

---

v1.2.4 — Aug 10, 2026

- Dashboard: Added Score Evolution, showing how your score changes over time.
- Notifications: Added Discord notifications for important events.
- Metrics: Rebuilt the metrics engine.

---

v1.2.3 — Aug 09, 2026

- Backend: Refined environment configuration.

---

v1.2.1 — Aug 09, 2026

- Notes: Added collapsible sections by heading.
- Editor: Added configurable editor modes.
- Vault: Added custom vault naming.
- Subscriptions: Added a new subscription management modal.
- Billing: Added automatic Stripe payment reconciliation with full event auditing.
- Time Tracking: Made requests time-zone aware.

---

v1.2.0 — Aug 04, 2026

- Visual Redesign: Redesigned nearly every core page, including Dashboard, Entities, Insights, Knowledge Graph, Notes, Pricing, Profile, Projects, Subscription, and Vault.
- UI: Introduced reusable interface components across the app.

---

v1.1.2 — Jul 29, 2026

- Landing Page: Fixed a minor visual issue.

---

v1.1.1 — Jul 29, 2026

- PWA: Added install support with installation prompts and buttons.
- Authentication: Reworked the Dashboard and authentication screens, including Login, Forgot Password, and Register.

---

v1.1.0 — Jul 29, 2026

- Time Tracking: Fixed time-tracking behavior.

---

v1.0.4 — Jul 28, 2026

- Security: Hardened backend security.

---

v1.0.3 — Jul 28, 2026

- Backend: Refined environment configuration.

---

v1.0.2 — Jul 28, 2026

- Codebase: Removed unused code and simplified the build configuration.

---

v1.0.1 — Jul 28, 2026

- Offline: Added offline support with automatic synchronization when connectivity is restored.
- Time Tracking: Added activity calendars and time-tracking history.
- Localization: Added a language switcher and modular translation system.
- Pages: Added About, Pricing, and Support pages.
- Goals: Added timer goals and related notifications.
- Billing: Migrated payments from Lemon Squeezy to Stripe.
- Billing: Removed the Lemon Squeezy integration.
- Import: Added Markdown file import with a confirmation step before committing changes.
- Editor: Expanded the note editor with find and replace, a status bar, keyboard shortcuts, and more.
- Authentication: Added a new sign-up experience.
- Analytics: Added Vercel Web Analytics and Speed Insights.
- Authentication: Fixed Google login and token refresh issues.

---

v1.0.0 — May 28, 2026

🎉 The first full release of Continuum.

- Authentication: Email/password and Google sign-in with secure token refresh.
- Vault: Private file storage backed by Backblaze B2.
- Notes: Notes linked to entities with an interactive Knowledge Graph.
- Insights: Dashboard, Insights, and usage metrics.
- Time Tracking: Time tracking for activities and entities.
- Billing: Subscription and billing support through Stripe and Lemon Squeezy.
- Website: Landing page, Terms, and Privacy pages.

---

Initial Commit — May 27, 2026

- Created the Continuum repository.
- Added the initial license.
- Added a placeholder README.