# Job Review App

Local React + TypeScript dashboard for reviewing job-search automation output from JSON files. The app is fully client-side, requires no backend, and is designed for fast job triage on your machine.

## What It Does

- Automatically loads every `.json` file under `public/data`
- Validates the JSON shape at runtime with `zod`
- Shows summary stats, sectioned roles, and report insights
- Supports filtering, sorting, keyword tags, and card/list views
- Opens a structured detail panel for each job

## Tech Stack

- Vite
- React
- TypeScript
- Zod

## Project Structure

```text
job-review-app/
  public/
    data/
      job-search-results.json
  src/
    components/
    data/
    types/
    utils/
    App.tsx
    main.tsx
    styles.css
  index.html
  package.json
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
```

## Install

From the `job-review-app` folder:

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Vite will print a local URL, usually:

```text
http://localhost:5173/
```

Open that URL in your browser.

## Build

```bash
npm run build
```

## Using Your Own JSON

1. Drop one or more automation output files into `public/data`.
2. The app ignores any `*.sample.json` files and reads real report files such as `job-search-results.json`.
3. Keep the top-level shape for each file:

```json
{
  "schema_version": "1.0.0",
  "generated_at": "2026-03-27T12:28:12.8954764-05:00",
  "meta": {},
  "stats": {},
  "jobs": [],
  "excluded_jobs": [],
  "summary": {}
}
```

4. Refresh the browser.

If any JSON file is malformed, the app shows a helpful validation error instead of failing silently.

## Notes

- Optional fields degrade gracefully and render as `Unknown`, `Not listed`, or empty-state text where appropriate.
- Multiple reports are merged client-side into one review board, with duplicate jobs collapsed by `dedupe_key` when present.
- Filters are persisted in the URL query string so you can refresh without losing your current view.
- The detail experience is an inspector panel rather than a separate route to keep scanning fast.
