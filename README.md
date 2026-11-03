# ScootGen

A colorful freestyle scooter combo generator and rider community starter built with Next.js, Tailwind CSS and Supabase.

## Included
- Random trick combos filtered by Park / Street / Flat, difficulty and trick count.
- Email sign-up and sign-in using Supabase Auth.
- Rider XP and challenge completion persistence.
- Saved combo persistence for signed-in riders.
- Responsive landing page and challenge cards.

## Run locally
1. Install Node.js 20+.
2. Extract this folder and run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Create a project at https://supabase.com and copy its Project URL and anon/public key into `.env.local`.
5. In Supabase SQL Editor, run all of `supabase/schema.sql`.
6. In Supabase Authentication settings, configure your Site URL and allowed redirect URLs (for local development, `http://localhost:3000`).
7. Run `npm run dev` and open http://localhost:3000.

## Important setup notes
- Supabase email confirmation may be enabled by default. Users may need to confirm their email before signing in.
- The starter uses client-side Supabase calls and Row Level Security. Never put a Supabase service-role key in a `NEXT_PUBLIC_` variable or in browser code.
- Challenge completion is self-reported in this MVP; it is not video-verified.
- The trick list and challenge catalogue are starter content. Expand and review them with experienced riders before launch.
- For production, add rate limiting, abuse reporting/moderation, privacy/terms pages, stronger XP validation on the server, and tests.
