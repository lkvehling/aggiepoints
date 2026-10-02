# aggiepoints.com

Static GitHub Pages site for Aggie Points.

- `/` — landing page (App Store download)
- `/launch` — live team registration tracker for the launch event. Add `?demo` for a rehearsal with simulated signups.

The tracker reads `get_team_registration_counts()` from Supabase (see `supabase/sql/launch_registration_tracker.sql` in the app repo).
