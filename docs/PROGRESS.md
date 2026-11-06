# Progress

Where Book A Star stands as of 2026-11-06. `docs/PROJECT_BRIEF.md` is the
source of truth for scope; this file records what is built.

## Phase 1 (MVP): built

| Feature | Where |
|---|---|
| Auth and roles (organizer / artist / admin) | `src/context/AuthContext.jsx`, `src/lib/auth.js`, `src/components/RoleRoute.jsx` |
| Artist profiles, pricing, portfolio | `src/pages/Profile.jsx`, `src/pages/ArtistProfile.jsx`, `src/components/ArtistProfileForm.jsx`, `src/components/PortfolioManager.jsx` |
| Search and filters | `src/pages/Artists.jsx`, `src/components/ArtistFilters.jsx`, RPC `search_artists` |
| Event posting | `src/pages/MyEvents.jsx`, `src/pages/EventEditor.jsx` |
| Booking request flow and negotiation | `src/pages/Bookings.jsx`, `src/pages/BookingDetail.jsx`, `src/lib/bookingRules.js` (mirrors the DB state machine) |
| Availability calendar | `src/pages/Calendar.jsx`, `src/components/AvailabilityCalendar.jsx` |
| Messaging | `src/components/MessageThread.jsx`, `src/components/MessageComposer.jsx` |
| Dashboards | `src/pages/Dashboard.jsx`, `ArtistDashboard.jsx`, `OrganizerDashboard.jsx` |
| Artist gig board | `src/pages/Gigs.jsx` |

## Phase 2: started

- Reviews (`ReviewForm.jsx`, `ReviewList.jsx`)
- Verification badges and admin panel (`src/pages/Admin.jsx`)
- Notifications with realtime bell (`src/pages/Notifications.jsx`, `NotificationBell.jsx`)
- Reports (`ReportForm.jsx`, `AdminReportList.jsx`)
- Payments: not started

## Database

Migrations `001`–`020` in `supabase/migrations/`. The newest three:

- `018` booking rules and notifications
- `019` symmetric negotiation rules (`last_offer_by`)
- `020` merged SELECT policies

SQL tests: `supabase/tests/001_security_and_booking_flow.sql` (rolled back).

## Tests

- `npm test`: 14 Vitest files, 75 tests, all passing on 2026-11-06
- `npm run test:e2e`: Playwright (`e2e/public.spec.js`, `e2e/booking-flow.spec.js`);
  needs `.env.e2e` and the seed in `supabase/seed/e2e_users.sql`

## Deploy

SPA rewrites for Vercel (`vercel.json`) and Netlify (`public/_redirects`).

## Next

1. Run the e2e suite against the live Supabase project
2. Payments (Phase 2)
3. Deploy to a public URL and walk the end-to-end flow from the brief
