# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## 1. Project summary

**Book A Star** is a talent-booking web platform for events. It connects event
organizers directly with stage talent — singers, bands, musicians, performers —
with no agency in the middle. Organizers post events and book artists; artists
keep full control of their own calendar, pricing and portfolio.

*(Not an A-star pathfinding project. The folder name is misleading.)*

**The problem it solves:** booking an artist today means endless phone calls,
steep agency fees, and talented creators who never get discovered.

**Three roles:**
- **Event Organizer** — posts events, searches artists, sends booking requests,
  negotiates, confirms, reviews afterwards.
- **Artist (Star)** — builds a profile and portfolio, sets pricing, manages an
  availability calendar, accepts / rejects / counter-offers on requests.
- **Admin** — verifies artists, handles reports and disputes.

**The one flow that must work end to end** (the brief's definition of done):
an organizer signs up, posts an event, finds an available artist, negotiates,
and confirms a booking — while the artist manages their profile, calendar and
requests. Deployed on a public URL, real data, no placeholder features.

**Booking status flow:**
`requested → negotiating → accepted → confirmed → completed`,
with `rejected` and `cancelled` as exits.

**Scope by phase (from the brief):**
- **Phase 1 (MVP)** — auth and roles, artist profiles, search and filters,
  event posting, booking request flow, calendar, messaging, dashboards.
- **Phase 2** — reviews, verification badges, notifications, admin panel, payments.
- **Phase 3** — recommendations, analytics, mobile app, multi-language.

Build Phase 1 completely before touching Phase 2.

**Owner:** B.Tech CS student. Knows HTML, CSS, JavaScript. First large
full-stack project. No prior React, Tailwind, SQL, or backend experience.

**What this means for how you work here:**
- Explain *why*, not just *what*, when introducing a new concept.
- Prefer the boring, well-documented approach over the clever one.
- Introduce one new concept at a time. Do not stack React Query +
  Zustand + TypeScript + a testing library on top of a first React project.
- When something fails, teach the debugging move, not just the fix.

**Working agreement (brief §15):** act as lead developer and mentor. Work in
small steps. For each step: name exactly which files to create, give the
complete code for them, explain how to run and test it, then **stop and wait
for confirmation** before starting the next step. Never skip error handling or
security to move faster.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build tool | **Vite 6** | Instant dev server and hot reload. `create-react-app` is deprecated and slow. |
| UI | **React 19** (JSX, not TypeScript) | It is JavaScript, which the owner already knows. TypeScript is deliberately deferred — one new language at a time. |
| Routing | **React Router 7** | Standard, and the app has multiple pages. |
| Styling | **Tailwind CSS 4** | Utility classes map almost 1:1 to CSS properties the owner already knows. No separate stylesheet to keep in sync, no class-name invention. |
| Backend | **Supabase** | Postgres + auth + storage + auto-generated API from one dashboard. Replaces writing a Node/Express server and auth from scratch, which would roughly double the project. |
| Security | **Postgres Row Level Security (RLS)** | The React app talks to the database directly, so the *database* must enforce who can read and write which rows. |

**Tailwind 4 note:** configured via the `@tailwindcss/vite` plugin plus a single
`@import "tailwindcss";` in `src/index.css`. There is deliberately **no**
`tailwind.config.js` and **no** `postcss.config.js` — v4 does not need them.
Ignore v3-era tutorials that tell you to create those files.

---

## 3. Folder structure

```
Book_A_star/
├── .env                  # real secrets — gitignored, never commit
├── .env.example          # template, safe to commit
├── .gitignore
├── CLAUDE.md             # this file
├── index.html            # Vite entry point
├── package.json
├── vite.config.js
├── docs/
│   └── PROJECT_BRIEF.md  # source of truth for WHAT we are building
├── supabase/
│   └── migrations/       # .sql files — every schema change, in order
└── src/
    ├── main.jsx          # mounts React, wraps the app in BrowserRouter
    ├── App.jsx           # route table only
    ├── index.css         # the one Tailwind import
    ├── lib/
    │   └── supabase.js   # the single Supabase client — import it, never re-create it
    ├── pages/            # one file per route (Home.jsx, Login.jsx, ...)
    ├── components/       # reusable pieces used by 2+ pages (Button, Card, Navbar)
    ├── hooks/            # custom hooks, including all data fetching (useBookings.js)
    └── context/          # React context providers (AuthContext.jsx)
```

**The rule that keeps this clean:** `pages/` decides *what* to show,
`hooks/` decides *how the data is fetched*, `components/` decides *how it looks*.

---

## 4. Coding rules

**Structure**
1. Function components only. No class components.
2. One component per file. File name matches the component: `PascalCase.jsx`.
3. If a component passes roughly 150 lines, split it.
4. A file in `components/` must not import from `pages/`.

**Data**
5. Import the shared client: `import { supabase } from '../lib/supabase.js'`.
   Never call `createClient` anywhere else.
6. No `supabase.from(...)` calls inside JSX or directly in a component body.
   Put every query in a custom hook in `hooks/` or a function in `lib/`.
   Components receive data as values, not as promises.
7. Every data fetch handles three states: **loading**, **error**, **empty**.
   A blank screen on failure is a bug, not a missing feature.
8. Always destructure and check the error: `const { data, error } = await ...`,
   then actually branch on `error`. Never ignore it.

**Security**
9. `.env` is never committed. Only `.env.example` is.
9a. **Never read a role or permission out of `user_metadata` / `auth.jwt()`.**
    `raw_user_meta_data` is user-editable — anyone can call
    `supabase.auth.updateUser({ data: { role: 'admin' } })`. Authorisation
    reads `profiles.role` from the table, always. The signup trigger touches
    metadata exactly once, on INSERT, through a whitelist that cannot produce
    `admin`; `lock_profile_role` guards it from then on. Do not widen this.
10. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` reach the browser.
    The `service_role` key must never appear anywhere in this repo.
11. **Client-side checks are UX, not security.** Hiding a delete button does
    not stop anyone. Every table must have RLS enabled with explicit policies.
    A table without RLS is a data leak.
12. Every schema change is written as a `.sql` file in `supabase/migrations/`
    with a numbered prefix, even when it was also clicked in the dashboard.
    This is how the schema stays reviewable.

**Style**
13. Tailwind utilities in `className`. Do not add a `.css` file per component.
14. Descriptive names over short ones: `isLoadingBookings`, not `l`.
15. Comment *why*, not *what*. The code already says what.

---

## 5. Build plan

Each step is independently testable — you should see it work before moving on.
**Do not skip ahead.**

### Phase A — Foundation (no brief needed, do these now)

1. **Scaffold runs.** `npm install`, then `npm run dev`.
   - Test: `http://localhost:5173` shows the "Book A Star" card.
2. **Tailwind works.** Change a class in `src/pages/Home.jsx`
   (`bg-slate-50` to `bg-red-200`) and save.
   - Test: the colour changes without a manual refresh. Then change it back.
3. **Supabase connected.** Create the project, copy `.env.example` to `.env`,
   paste the URL and anon key, restart the dev server.
   - Test: the card reads `Supabase: connected to Supabase`.
4. **Git initialised and `.env` is safe.** `git init`, `git add -A`, `git status`.
   - Test: `.env` does **not** appear in the staged list. Then commit.

### Phase B — Auth (brief needed only to name the roles)

5. **Signup and login pages** using `supabase.auth.signUp` and
   `signInWithPassword`.
   - Test: a new user appears under Authentication → Users in the dashboard.
6. **AuthContext** in `src/context/` exposing `user`, `loading`, `signOut`,
   subscribed to `onAuthStateChange`.
   - Test: refreshing the page keeps you logged in.
7. **Protected route** that redirects logged-out users to `/login`.
   - Test: open the protected URL in a private window → redirected.

### Phase C — Data

8. **First table and its RLS.** Write migration `001_<table>.sql` containing
   the table, `alter table ... enable row level security`, and explicit policies.
   - Test: the SQL editor shows the table as RLS-enabled.
9. **Prove RLS actually bites.** Create two test users. Log in as user B and
   try to read and edit user A's row.
   - Test: it returns nothing, or errors, rather than succeeding.
   - If user B can see user A's data, stop and fix the policy before continuing.
10. **Read path:** a `hooks/use<Thing>.js` hook plus a page that lists the rows,
    with loading, error and empty states.
    - Test: insert a row by hand in the dashboard → it appears in the UI.
11. **Write path:** a form that inserts, with validation and error display.
    - Test: submit → the row appears in the dashboard table.
12. **Update and delete**, scoped to the owner.
    - Test: your own row changes; another user's does not.

### Phase D — MVP feature work (brief Phase 1)

Ordered so that each step has something real to test against. Phase C's
steps 8–12 are done against `profiles` and `artist_profiles` specifically.

**D1 — Identity and profiles**

13. **Role-aware signup.** Signup form asks organizer or artist. A
    `handle_new_user` trigger creates the `profiles` row from auth metadata.
    - Test: sign up one of each. Both appear in `profiles` with the right role.
    - Test: as an artist, try `update profiles set role='admin'` from the app.
      It must fail. (This is the privilege-escalation guard.)
14. **Artist profile editor** — stage name, category, bio, languages, city,
    pricing, `is_published` toggle.
    - Test: save, refresh, values persist. Unpublish → gone from directory.
15. **Organizer profile editor** — organization name, type, city.
    - Test: same persistence check.
16. **Portfolio upload** to Supabase Storage (`portfolio` bucket) plus external
    video/audio URLs.
    - Test: upload an image, see it render. Then confirm from another artist's
      account that you cannot upload into the first artist's folder.

**D2 — Discovery**

17. **Artist directory** listing published artists as cards.
    - Test: an unpublished artist never appears, even when logged out.
18. **Filters** — category, city, price range, minimum rating.
    - Test: each filter alone, then two combined.
19. **Artist public profile page** — portfolio, pricing, reviews, calendar.
    - Test: reachable while logged out; phone number is *not* in the response.
20. **Availability calendar** — artist blocks and unblocks dates.
    - Test: block a date, reload, still blocked.
21. **"Available on date" filter** via the `search_artists` RPC.
    - Test: block a date as an artist → that artist disappears from results
      for that date and reappears for the next day.

**D3 — The booking loop (the core of the project)**

22. **Post an event** — title, type, date, city, venue, budget, audience size,
    requirements.
    - Test: event appears in "My events".
23. **Send a booking request** from an artist profile, choosing one of your
    open events.
    - Test: row lands in `bookings` with status `requested`.
    - Test: requesting the same artist for the same event twice is rejected.
24. **Artist request inbox** — accept, reject, or counter-offer.
    - Test: all three transitions. Then try an illegal one (artist jumping
      straight to `confirmed`) — the trigger must block it.
25. **Message thread per booking**, with price offers as a message type.
    - Test: both sides see the thread. Then log in as an unrelated third user
      and try to read it — must return nothing.
26. **Realtime messages** via Supabase Realtime on the `messages` table.
    - Test: two browser windows, message appears without refresh.
27. **Confirm the booking** (organizer, after `accepted`).
    - Test: status reaches `confirmed`.
    - Test: confirm a *second* artist booking for the same artist on the same
      date → must fail on the unique index. This is the double-booking guard.
28. **Mark completed** after the event date.
    - Test: completing before the event date is refused.

**D4 — Dashboards**

29. **Organizer dashboard** — my events, booking statuses, upcoming bookings.
30. **Artist dashboard** — upcoming bookings, pending requests, earnings
    summary, rating.
    - Test for both: numbers match what is actually in the database.

### Phase E — Polish

- Responsive check at 375px wide.
- Empty states and error messages on every page.
- `npm run build` succeeds and `npm run preview` works.
- README with setup steps and a screenshot.

---

## 6. Database schema

> **Status: approved and written to `supabase/migrations/001`–`015`.**
> This section is the readable summary; the `.sql` files are the truth.
> Any schema change means a NEW numbered migration — never edit one that has
> already been run.

Run order: `001_enums` → `002_profiles` → `003_artist_profiles` →
`004_organizer_profiles` → `005_portfolio_items` → `006_availability` →
`007_events` → `008_bookings` → `009_messages` → `010_reviews` →
`011_notifications` → `012_reports` → `013_search` → `014_storage` →
`015_realtime`.

### Enums

| Enum | Values |
|---|---|
| `user_role` | organizer, artist, admin |
| `artist_category` | singer, band, musician, dancer, dj, comedian, anchor, magician, other |
| `media_type` | image, video, audio |
| `event_type` | wedding, college_fest, corporate, concert, private_party, other |
| `event_status` | draft, open, closed, completed, cancelled |
| `booking_status` | requested, negotiating, accepted, confirmed, completed, rejected, cancelled |
| `verification_status` | pending, approved, rejected |
| `report_status` | open, reviewing, resolved, dismissed |

### Tables

**`profiles`** — one row per user, mirrors `auth.users`. Safe-to-show fields only.
`id` uuid PK → `auth.users(id)` ON DELETE CASCADE · `role` user_role ·
`full_name` text · `avatar_url` text · `city` text · `created_at` · `updated_at`

**`profiles_private`** — the fields that must never be scrapeable.
`id` uuid PK → `profiles(id)` CASCADE · `email` text · `phone` text

**`artist_profiles`** — 1:1 with a profile whose role is artist.
`id` uuid PK → `profiles(id)` CASCADE · `stage_name` · `category` ·
`bio` · `languages` text[] · `base_city` · `travels_outside_city` bool ·
`price_min` numeric · `price_per_event` numeric · `price_per_hour` numeric ·
`currency` char(3) default 'INR' · `experience_years` int ·
`cover_image_url` · `avatar_url` · `is_published` bool default false ·
`verification_status` default pending · `is_verified` bool default false ·
`rating_avg` numeric(3,2) default 0 · `rating_count` int default 0 ·
`created_at` · `updated_at`

**`organizer_profiles`** — 1:1 with a profile whose role is organizer.
`id` uuid PK → `profiles(id)` CASCADE · `organization_name` ·
`organizer_type` · `city` · `website` · `created_at` · `updated_at`

**`portfolio_items`**
`id` uuid PK · `artist_id` → `artist_profiles(id)` CASCADE · `media_type` ·
`storage_path` · `external_url` · `title` · `description` · `event_name` ·
`event_date` date · `sort_order` int · `created_at`
CHECK: at least one of `storage_path` / `external_url` is present.

**`availability`** — artist-declared blocked dates only. Booked dates are
derived from `bookings`, never duplicated here.
`id` uuid PK · `artist_id` → `artist_profiles(id)` CASCADE · `date` date ·
`note` · `created_at` · UNIQUE(`artist_id`, `date`)

**`events`**
`id` uuid PK · `organizer_id` → `organizer_profiles(id)` CASCADE · `title` ·
`event_type` · `event_date` date · `start_time` · `duration_hours` ·
`city` · `venue` · `budget_min` · `budget_max` · `audience_size` ·
`requirements` · `status` event_status default open · `is_public` bool
default true · `created_at` · `updated_at`

**`bookings`** — the heart of the app. One row per (event, artist) negotiation.
`id` uuid PK · `event_id` → `events(id)` CASCADE ·
`artist_id` → `artist_profiles(id)` RESTRICT ·
`organizer_id` → `organizer_profiles(id)` RESTRICT *(denormalized so RLS needs
no join)* · `event_date` date *(copied from the event, for the double-booking
index)* · `initiated_by` user_role · `status` booking_status default requested ·
`proposed_price` · `agreed_price` · `currency` · `notes` ·
`cancelled_by` uuid · `cancellation_reason` · `created_at` · `updated_at`
- UNIQUE(`event_id`, `artist_id`)
- **Partial unique index** on (`artist_id`, `event_date`)
  WHERE `status` IN ('accepted','confirmed') — the double-booking guard.

**`messages`**
`id` uuid PK · `booking_id` → `bookings(id)` CASCADE ·
`sender_id` → `profiles(id)` · `body` text · `message_type`
(text | price_offer | system) · `offer_amount` numeric · `read_at` · `created_at`

**`reviews`** — organizer reviews artist, one per completed booking.
`id` uuid PK · `booking_id` → `bookings(id)` UNIQUE ·
`reviewer_id` → `profiles(id)` · `artist_id` → `artist_profiles(id)` ·
`rating` int CHECK 1–5 · `comment` · `created_at`
A trigger recomputes `artist_profiles.rating_avg` / `rating_count`.

**`notifications`**
`id` uuid PK · `user_id` → `profiles(id)` CASCADE · `type` · `title` ·
`body` · `link_url` · `related_booking_id` · `is_read` bool · `created_at`

**`reports`**
`id` uuid PK · `reporter_id` → `profiles(id)` · `reported_user_id` ·
`reported_booking_id` · `reported_review_id` · `reason` · `details` ·
`status` report_status default open · `admin_notes` · `resolved_by` ·
`resolved_at` · `created_at`

### Grants

RLS decides *which rows*. Grants decide whether the table is reachable through
the Data API **at all**. Both are needed — without the grants every browser
query fails with "permission denied" and the policies never run. Each table
migration carries its own `grant` lines next to its `enable row level security`.

### Helper functions

Everything internal lives in the **`private` schema**, not `public`. Postgres
grants `EXECUTE` to `PUBLIC` on every new function, so a `SECURITY DEFINER`
function in `public` is a callable API endpoint for `anon` and `authenticated`.
Supabase only serves `public` through the Data API, so `private` helpers remain
usable by policies and triggers while being unreachable from the browser.
`grant usage on schema private to anon, authenticated` is required — a policy
expression is evaluated as the querying user.

`private.*` — all `SECURITY DEFINER`, `STABLE`. Required to avoid **infinite
recursion**: a policy on `profiles` cannot itself `SELECT FROM profiles`.
- `current_user_role() → user_role`
- `is_admin() → boolean`
- `shares_booking_with(profile_id uuid) → boolean`
- `artist_is_published(uuid)`, `owns_event(uuid)`
- `is_booking_participant(uuid)`, `booking_is_open(uuid)`, `can_review_booking(uuid)`
- `notify(...)` plus every trigger function

`public.*` — exactly three, all deliberate client RPCs:
- `artist_is_available(artist_id uuid, d date) → boolean`
  (checks `availability` **and** accepted/confirmed `bookings`; `SECURITY DEFINER`
  because it must read `bookings`, which the caller cannot)
- `search_artists(...)` — directory search. **`SECURITY INVOKER`**: RLS already
  grants read access to published artists, so there is no reason to switch it off.
- `mark_messages_read(booking_id uuid)` — the only way to set `read_at`

### Triggers

| Trigger | Purpose |
|---|---|
| `handle_new_user` on `auth.users` | create the `profiles` row on signup |
| `lock_profile_role` on `profiles` | block self-promotion to admin |
| `lock_artist_verification` on `artist_profiles` | only admin sets `is_verified` / `verification_status`; nobody sets `rating_*` by hand |
| `enforce_booking_transition` on `bookings` | state machine — see below |
| `sync_booking_event_date` on `bookings` | copy `event_date` from the event |
| `recalc_artist_rating` on `reviews` | maintain `rating_avg`, `rating_count` |
| `set_updated_at` on all tables with it | timestamp maintenance |

**Booking state machine** (enforced in the trigger, not in RLS — RLS can see
the new row but expressing *transitions* belongs in a trigger):

| From | To | Who |
|---|---|---|
| requested | negotiating, accepted, rejected | artist |
| requested | cancelled | organizer |
| negotiating | accepted, rejected | artist |
| negotiating | cancelled | organizer |
| accepted | confirmed | organizer |
| accepted | cancelled | either |
| confirmed | completed | either, only on/after `event_date` |
| confirmed | cancelled | either |
| completed / rejected / cancelled | — | terminal |

### RLS policies

Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. `—` means no
policy exists, so the operation is impossible for normal users.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | self, admin, or someone you share a booking with | self (`id = auth.uid()`) | self or admin | — |
| `profiles_private` | self or admin | self | self or admin | — |
| `artist_profiles` | **anon + auth** where `is_published`; plus self; plus admin | self, and role is artist | self or admin | self or admin |
| `organizer_profiles` | self, admin, or an artist who shares a booking | self, and role is organizer | self or admin | self or admin |
| `portfolio_items` | **anon + auth** when parent artist is published; plus owner, admin | owner | owner | owner or admin |
| `availability` | **anon + auth** when parent artist is published | owner | owner | owner |
| `events` | owner; admin; artists when `is_public and status='open'`; plus any artist with a booking on it | self, and role is organizer | owner or admin | owner, only while `draft`/`open` and no bookings exist |
| `bookings` | participant or admin | organizer for own event, or artist for self; `status` must be `requested` | participant (transitions policed by trigger) | — (cancel instead); admin only |
| `messages` | participant or admin | participant, `sender_id = auth.uid()`, booking not terminal | — (read receipts via RPC) | — |
| `reviews` | **anon + auth**: all | reviewer is the organizer on that booking **and** booking is `completed` | reviewer | reviewer or admin |
| `notifications` | `user_id = auth.uid()` | — (triggers / service role only) | own, `is_read` only | own |
| `reports` | reporter or admin | reporter is self | admin only | admin only |

### Storage buckets

| Bucket | Read | Write |
|---|---|---|
| `avatars` | public | owner, path prefixed `{auth.uid()}/` |
| `portfolio` | public | artist owner, path prefixed `{auth.uid()}/` |

### Realtime

Enable on `messages` and `bookings` only. Realtime respects RLS, so the
policies above are what keep subscriptions private.

### Deliberate deviations from brief §9

1. **`users` → `profiles`.** Supabase already owns `auth.users`; a second
   `users` table is a guaranteed source of confusion.
2. **`profiles_private` added.** Keeps phone and email out of any query that
   renders a public artist card. Without this, one `select *` leaks every
   user's phone number.
3. **`rejected` added to the status flow.** The brief says an artist can
   reject, but the listed statuses had no state for it.
4. **`currency` is `text` with a length check**, not `char(3)` — `char(n)` is
   blank-padded and produces surprising comparison results.
5. **`bookings.organizer_id` and `bookings.event_date` are denormalized**
   copies. Justified: both are needed inside RLS policies and the
   double-booking index, where a join would be slow and awkward. Kept
   truthful by the `sync_booking_event_date` trigger.

---

## 7. Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (once, and after any `package.json` change) |
| `npm run dev` | Start the dev server at `http://localhost:5173` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally to verify it |

Restart `npm run dev` after editing `.env` — Vite reads env vars only at startup.

---

## 8. Design direction (brief §11)

- Dark navy background with a soft purple glow.
- **Gold/yellow is the primary accent**; purple and red are secondary.
- Bold modern headings where one word is highlighted in gold
  (e.g. "The **Story**", "**Direct** Connection").
- Rounded cards, subtle borders, high-quality live-event photography.
- Mobile-first and responsive — check 375px before calling a screen done.

Define these as CSS custom properties in `src/index.css` using Tailwind 4's
`@theme` block, then use them as normal utilities (`bg-ink`, `text-gold`).
Do not scatter raw hex values across components.

---

## 9. Deferred to later phases

Out of scope until Phase 1 is complete and working:
hosting on Vercel/Netlify, Resend email notifications, Razorpay payments
(test mode), recommendations, analytics, mobile app, multi-language.
