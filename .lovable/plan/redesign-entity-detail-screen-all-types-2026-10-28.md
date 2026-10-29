# Redesign: Entity detail screen (all types)

One shared layout for every type (Topic, Person, Organization, Project, Activity), keeping the app's look: the plain list style from Notes and the grouped, labeled sections from Settings.

## Problems being fixed
- The bottom accordions ("drawers") hide important things (connected notes, links) and repeat info already shown above (created date and connection count appear twice).
- Type and workspace are hidden inside "Metadata".
- Projects and activities pile their timer, heatmap, calendar and date picker on top of each other without labels.

## New structure (top to bottom)
1. **Top bar**: back button on the left; edit and delete in a small "..." menu on the right.
2. **Header**: type icon + type label (tap to change type), large title (tap to edit), description (tap to edit), insight badge.
3. **Summary row**: 2-3 compact numbers, with no repeats:
   - Topic/Person/Org: connected notes · connections · created
   - Project: total time · this week · notes
   - Activity: total check-ins · current streak · notes
4. **Main section** (projects and activities only), a titled group like in Settings:
   - Project: "Time": timer card, then heatmap.
   - Activity: "Tracking": a "Mark today" button with done state, the calendar, and a smaller "log another date" option inside it.
5. **Connected notes**: always visible, in the same row style as the Notes list. Shows 5, then a "Show all (N)" link.
6. **Connections**: always visible, in rows with the type icon and the type name translated.
7. **Details** (Settings-style group at the end): workspaces, type, created date.

No accordions. Each section has a small caps title, like Settings. The layout fits phones first and uses a wider two-column layout on desktop (main content on the left; notes and connections on the right).

## Technical notes
- Rework `src/pages/EntityDetail.tsx` render only; keep data fetching, mutations and cache updates unchanged.
- Extract small presentational pieces (`EntitySection`, `EntityStatRow`, `EntityLinkRow`) in `src/components/entity/`.
- Reuse the existing TimerWidget, TimeHeatmap, ActivityAnalyticsCalendar and WorkspaceAssign; use only semantic tokens and add any new labels to the i18n files (PT/EN).
- Get the streak and week figures from data that already exists; skip a stat if the data isn't available.
