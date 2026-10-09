# Darfat

A platform for development opportunities, personal tasks, and digital profiles,
available in Kurdish Sorani, Arabic, and English. Built with Next.js, React,
Tailwind CSS, and Supabase.

## Languages

Use the language selector in the top navbar. Kurdish (`ckb`) is the default;
Arabic (`ar`) and Kurdish use RTL, and English (`en`) uses LTR. Arabic and English
use the self-hosted Rubik variable font, including normal and italic styles.
The `darfat-language` cookie remembers the selection for one year.

Interface translations live in `lib/i18n/messages.js`. Client components use
`useI18n()`; server components use `getServerI18n()`. Dates and numbers use the
same locale. Pages live under `app/[locale]`, while the proxy keeps public URLs
stable and checks authentication before rewriting to the selected locale.
Stored opportunities and user-authored content retain their original text.

## Run locally

Use Node.js 22 or later and npm.

1. Run `npm ci` to install the locked dependencies.
2. Copy `.env.example` to `.env.local` only if a local environment does not already exist.
3. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `DATABASE_URL` for the existing project.
   `DATABASE_URL` is required for opportunities and admin features; an Auth key alone does not configure PostgreSQL.
4. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

AI features also need `GEMINI_API_KEY` or `GROQ_API_KEY`. Tasks need the dedicated
`TASK_DATABASE_URL`; see [task configuration](docs/tasks.md). See
[authentication configuration](docs/authentication.md) for signup and session setup.
Keep `.env.local` and all credentials out of Git.

If PowerShell cannot find Node.js or npm on this Windows installation, add the
installed runtime to the current shell before running commands:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
npm run dev
```

If Next.js reports that this project already has a development server, open its
reported URL and reuse it.

## Verify

```sh
npm test
npm run lint
npm run build
```

With the development server running:

```sh
npm run test:routes
npm run test:browser
npm run test:i18n:browser
```

Unit tests run offline, including database timeout checks against a local test
socket. Browser checks use Playwright with installed Chrome and validate form
errors, password controls, and mobile layout without creating accounts. The
first browser run may download Playwright into npm's cache.

For a production server, run `npm run build` followed by `npm start`.
