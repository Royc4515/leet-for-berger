# ADR 0001: Vanilla ES modules, no build step

- Status: accepted
- Date: 2026-11-16

## Context

The platform needs a Monaco editor, Web Workers, a router and a handful of views. Frameworks (React, Svelte) and bundlers (Vite) are the default choice for that.

## Decision

Ship v0.x as vanilla ES modules served as-is. Monaco and Pyodide load from pinned CDN builds. No `node_modules` are needed at runtime.

## Why

- GitHub Pages deploy is "push the repo". No build to break, no lockfile drift in production.
- Every file in the diff is the file that runs, which keeps Claude Code changes easy to review.
- The UI surface is small; `ui/dom.js` (one `h()` helper) covers it.
- Monaco's ESM build needs bundler worker plumbing; the AMD CDN build avoids it entirely.

## Consequences

- No JSX, no reactive state. Views re-render explicitly on store changes.
- No tree-shaking or minification. Acceptable at current size; revisit if first-load JS (excluding CDN) passes ~150 KB.
- Revisit this ADR when: a backend arrives (Phase 2), or view count passes ~10, or a component needs fine-grained reactivity.
