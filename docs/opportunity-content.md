# Opportunity content languages

The selected site language also controls model translation of real opportunity content on the opportunity listing and detail pages. English and Arabic translate the title, description, benefits, application instructions, organizer, location, required skill labels and visible matching explanations. Kurdish uses the saved source content.

This is separate from the interface translation catalog. Collection, source records, links, deadlines, identifiers, matching scores and skill matching stay unchanged. The model receives text fields only. Translated skill labels retain their original values for matching highlights.

The server uses the existing admin-selected AI configuration, with bounded calls and one retry for short provider-requested rate-limit cooldowns. Successful translations are cached by source content and language, reused between listing and detail pages, and invalidated by source text changes. Only visible cards are translated. Failed translations show the original content with a notice and can be retried on another visit; failures are not cached as successful translations.

Checks:

```sh
node --conditions=react-server --test scripts/test-opportunity-content.mjs
node scripts/test-opportunity-content-browser.mjs
```

The live browser check needs the running local app, its existing database connection and Playwright (or `PLAYWRIGHT_MODULE` pointing to its entry module). It registers and completes onboarding for a disposable user, tests a real published opportunity in English/Arabic/Kurdish, checks the English list and mobile layout, and removes only its own test account afterward.
