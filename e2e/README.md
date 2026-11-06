# End-to-end tests (Playwright)

These tests open a real Chromium browser, click through the real app, and
talk to the real Supabase project. They prove the brief's definition of done:
an organizer posts an event, finds an available artist, negotiates and
confirms, while the artist answers from a second browser and a third user is
kept out.

## One-time setup

1. `npx playwright install chromium`
2. Create `.env.e2e` in the project root (it is gitignored):

   ```
   E2E_PASSWORD=<pick a long random password>
   E2E_ORGANIZER_EMAIL=e2e-organizer@bookastar.test
   E2E_ARTIST_EMAIL=e2e-artist@bookastar.test
   E2E_STRANGER_EMAIL=e2e-stranger@bookastar.test
   ```

3. Open `supabase/seed/e2e_users.sql`, replace `E2E_PASSWORD_HERE` with the
   same password, and run it in the Supabase SQL editor. Do not save the
   password into the file.

## Run

```
npm run test:e2e
```

Playwright starts `npm run dev` for you (or reuses one that is running).
To test a deployed site instead: `E2E_BASE_URL=https://your-site npm run test:e2e`.

When a test fails, open the report with `npx playwright show-report`. It has a
screenshot and a step-by-step trace of what the browser did.

## Clean up

Each run creates a real event and booking. `supabase/seed/e2e_cleanup.sql`
deletes them and keeps the three accounts.
