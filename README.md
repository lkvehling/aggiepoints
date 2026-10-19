# aggiepoints.com

Static GitHub Pages site for Aggie Points.

- `/` — landing page (App Store download)
- `/launch` — live team registration tracker for the launch event. Add `?demo` for a rehearsal with simulated signups.
- `/sarg` — SARG (Student Athlete Resource Group) portal: leaders sign in with their normal Aggie Points login and submit events/meetings by street address (geocoded with OpenStreetMap's Nominatim, pin draggable); admins sign in to the same page to approve/reject them and to add SARG leaders. Add `?demo` to preview with fake data and no sign-in. Backed by `supabase/sql/sarg_event_submissions.sql` (app repo).
- `/coach` — coaches portal: roster ranked by points, registration/verification progress, team leaderboard, upcoming events and the team code. Coach logins only (`role = 'coach'`). Add `?demo` to preview the layout with fake data and no sign-in.

The tracker reads `get_team_registration_counts()` from Supabase (see `supabase/sql/launch_registration_tracker.sql` in the app repo).

The coaches portal reads the coach functions in `supabase/sql/coaches_portal.sql` (app repo); everything it calls is scoped server-side to the signed-in coach's own team. Its only write is `regenerate_team_code()`.
