# Static onboarding

The onboarding page asks five fixed questions in this order: name, age, optional
introduction, interests, and skills. Name is required (2–100 characters), and age
must be a whole number from 10 to 100, matching the existing profile constraint.
The introduction allows 500 characters. Interests and skills are optional.

The searchable pickers provide 70 interests and 88 skills, with custom entries
and removal. Each list allows 30 selections of up to 120 characters. A typed
custom entry is also included when Continue or Finish is pressed without Add.
Back preserves answers. Failed saves preserve the form and can be retried.
Leaving an unfinished flow and returning restarts at step one. Answers are only
persisted when Finish succeeds; refreshes and browser-history restores discard
unfinished drafts. Unfinished user accounts are redirected to onboarding from
other pages, including the homepage, and receive `403 onboarding_required` from
other APIs. Server page and mutation guards enforce the same restriction.
Session checks, sign-out, and onboarding completion remain available. Existing
admin access is preserved. Full navigation appears after completion; before
that the header contains branding, language selection, and sign-out only.
The onboarding UI uses the site's shared light surfaces, fields, and orange palette.
Questions and option labels support Kurdish, Arabic, and English; preset values
remain stable across languages, and custom entries retain the user's wording.

`app/onboarding/actions.js` authenticates and validates every submission, then
updates only `name`, `age`, `bio`, `interests`, `skills`, and
`onboarding_completed` on the verified user's existing Supabase profile.
Existing profile RLS remains in force. No schema changes are required. City,
headline, role, and avatar are preserved. Successful completion uses the existing
redirect to opportunities. The existing task and matching features read these
same profile columns.

Onboarding performs no AI calls. The former onboarding chat component and API
route have been removed; AI behavior elsewhere is unchanged.

Run the validation and save-boundary tests with:

```sh
node --conditions=react-server --test scripts/test-onboarding.mjs
node --conditions=react-server --test scripts/test-onboarding-access.mjs
```

For browser verification, start the local app and run
`node scripts/test-onboarding-browser.mjs` with Playwright installed, or set
`PLAYWRIGHT_MODULE` to the absolute path of an existing Playwright `index.mjs`.
The test uses a disposable account, verifies the actual Supabase profile save,
then removes its account and profile. It covers validation, navigation, search,
custom entries, removal, save retry, mobile and RTL layouts. Screenshots are saved
under the ignored `.next/onboarding-qa` directory.
