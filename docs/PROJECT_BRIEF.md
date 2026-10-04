# PROJECT BRIEF: BOOK A STAR

> Note for Claude: "Book A Star" is a talent-booking web platform for events (artists and event organizers). It is NOT an A* pathfinding project.

## 1. One-line description
Book A Star is a web platform that connects event organizers directly with stage talent (singers, bands, musicians, performers), with no agencies or middlemen. Organizers post events and book artists; artists manage their own calendar, pricing and portfolio.

## 2. Problem (from the pitch deck)
- Booking artists means endless phone calls.
- Middleman and agency fees are steep.
- Creators struggle to get discovered.

## 3. Solution
A direct digital bridge between organizers and artists, where discovery, communication, negotiation and booking confirmation all happen on one platform.

## 4. Mission
Build a vibrant community of artists and event organizers, not just another startup platform. Community features (profiles, reviews, discovery) matter as much as the booking flow.

## 5. User roles
1. **Event Organizer**: posts event requirements, browses verified star talent, views authentic performance portfolios, communicates, negotiates and confirms bookings.
2. **Artist (Star)**: keeps total control of calendar, pricing and showcase; receives and answers booking requests.
3. **Admin**: verifies artists, handles reports and disputes, monitors the platform.

## 6. Core features

### Organizer
- Sign up and log in; organizer profile
- Post an event: title, type (wedding, college fest, corporate, concert), date, city and venue, budget, audience size, requirements
- Search and filter artists by category, city, price range, rating and availability on a date
- View artist profile with portfolio (photos, videos, past events), price and reviews
- Send a booking request or invite an artist to an event
- Negotiate price and details in a message thread
- Confirm booking; see all bookings and statuses
- Leave a review after the event

### Artist
- Sign up and log in; create profile (stage name, category, bio, languages, city)
- Upload portfolio (images, video links, audio)
- Set pricing (per event or per hour, with a minimum)
- Manage availability calendar (block dates, show booked dates)
- Receive requests, then accept, reject or counter-offer
- Dashboard: upcoming bookings, requests, earnings summary, rating

### Admin
- Review and verify artist profiles ("verified star" badge)
- Manage users, events, reports and reviews

### Shared
- Real-time or near-real-time booking availability
- In-app messaging per booking
- Notifications (email and in-app) for new requests, replies and confirmations
- Booking status flow: Requested, Negotiating, Accepted, Confirmed, Completed, Cancelled

## 7. Main user flows
1. **Organizer**: register, post event, search artists, view profile, send request, negotiate, confirm, event happens, leave review.
2. **Artist**: register, build profile, set calendar and price, receive request, accept or counter, confirm, perform, get reviewed.
3. **Admin**: review verification queue, approve or reject, handle reports.

## 8. Pages and screens
Landing page (story, how it works, featured artists), Login/Register, Artist directory with filters, Artist profile, Post event, Organizer dashboard, Artist dashboard, Availability calendar, Booking details with message thread, Reviews, Admin panel, Settings.

## 9. Data model (tables)
users, artist_profiles, organizer_profiles, portfolio_items, availability, events, bookings (booking requests), messages, reviews, notifications, reports.

## 10. Tech stack
- Frontend: React + Vite + Tailwind CSS
- Backend and database: Supabase (Postgres, Auth, Storage, Row Level Security, Realtime)
- Hosting: Vercel or Netlify
- Email notifications: Resend or Supabase functions
- Payments (phase 2): Razorpay in test mode

## 11. Design direction (from the pitch deck)
- Dark navy background with soft purple glow
- Gold/yellow as the main accent; purple and red as secondary accents
- Bold modern headings with a gold highlight word (for example "The Story", "Direct Connection")
- Rounded cards with subtle borders; high-quality live-event photography
- Responsive and mobile-first

## 12. Non-functional requirements
Secure authentication and role-based access, protected data (Row Level Security), fast load times, accessible and mobile friendly, input validation, clear error and loading states.

## 13. Phases
- **Phase 1 (MVP):** auth and roles, artist profiles, search and filters, event posting, booking request flow, calendar, messaging, dashboards.
- **Phase 2:** reviews, verification badges, notifications, admin panel, payments.
- **Phase 3:** recommendations, analytics, mobile app, multi-language.

## 14. Definition of done
An organizer can sign up, post an event, find an available artist, negotiate and confirm a booking. An artist can manage profile, calendar and requests. All of it works on a deployed public URL with real data and no placeholder features.

## 15. How I want you to work
I am a B.Tech CS student who knows HTML, CSS and JavaScript. Act as lead developer and mentor. Work in small steps. For each step, tell me exactly which files to create, give complete code, explain how to run and test it, and wait for my confirmation before the next step. Do not skip error handling or security.
