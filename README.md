# Brandon Notton Coaching

A real, deployable web app for personal training: client/coach accounts with real
passwords, training sessions, macro tracking, step/cardio logging, strength &
body-weight progress, and progress photos.

This replaces the Claude-artifact prototype with a normal web app: **Supabase**
for the database, authentication, and photo storage, and **Vercel** (or any
static host) to serve it on a real URL that works for anyone, no Claude
account required.

---

## 1. Set up Supabase (the database + login system)

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New project**. Pick any name/region, set a database password (save it
   somewhere), and wait ~2 minutes for it to spin up.
3. In the left sidebar, open **SQL Editor** → **New query**.
4. Open `supabase/schema.sql` from this project, copy the whole file, paste it
   into the SQL editor, and click **Run**. This creates every table, security
   rule, and the photo storage bucket in one go.
5. In the left sidebar, open **Settings → API**. You'll need two values from
   this page in the next step:
   - **Project URL**
   - **anon public** key

### Turn off email confirmation (recommended for a small client app)

By default Supabase makes new users confirm their email before they can log
in. For a closed group of clients that's extra friction. To turn it off:
**Authentication → Providers → Email** → turn off **"Confirm email"**.
(You can leave it on if you'd rather clients verify their email first.)

---

## 2. Run it locally to test

You'll need [Node.js](https://nodejs.org) installed (any recent version).

```bash
cd brandon-notton-coaching
npm install
cp .env.example .env
```

Open `.env` and paste in your Supabase **Project URL** and **anon public key**
from step 1.5 above.

```bash
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Create a coach
account, then a client account (in a different browser or incognito window),
and confirm everything saves and loads correctly.

---

## 3. Deploy it for real (Vercel)

1. Push this project to a GitHub repository (create a new repo, then:
   `git init && git add . && git commit -m "init" && git remote add origin <your-repo-url> && git push -u origin main`).
2. Go to [vercel.com](https://vercel.com), sign up free, click **Add New →
   Project**, and import that GitHub repo.
3. Vercel will auto-detect it's a Vite project. Before deploying, add your
   environment variables: **Settings → Environment Variables**, add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values from
   your `.env` file.
4. Click **Deploy**. In about a minute you'll get a real URL like
   `brandon-notton-coaching.vercel.app` — send that to anyone, no Claude
   account, no sign-in wall, just a working app.

(Netlify works the same way if you'd rather use that — drag-and-drop the
`dist` folder after running `npm run build`, or connect the GitHub repo the
same way and set the same two environment variables.)

---

## How data is structured

- **One coach manages many clients.** Any account marked "Coach" at signup can
  see and edit every client's data. This matches a one-trainer-many-clients
  setup. If you ever need multiple independent coaches who shouldn't see each
  other's clients, that's a schema change (ask and I can adjust it).
- **Progress photos** are stored in Supabase Storage (not the database
  directly), in a private bucket — only signed-in users of this app can view
  them, via short-lived signed URLs.
- **Passwords** are handled entirely by Supabase Auth — this app never sees or
  stores raw passwords.

## Customizing further

- Brand colors live in `src/lib/helpers.js` (the `C` object).
- The starter program every new client gets is in `seedProgram()` in the same
  file — edit it to match your actual default program.
- Logo files are in `src/assets/`.
