# Repository Guidelines

## Project Structure & Module Organization
The Nuxt 4 app lives at the repo root. Vue route files sit in `pages/`, shared components in `components/`, and cross-cutting logic in `composables/` and `stores/`. Domain-specific GraphQL documents are under `graphQLData/`, while reusable utilities and types live in `utils/` and `types/`. Cypress specs reside in `cypress/e2e`, unit tests in `tests/unit`, and static assets in `public/` and `assets/`. Reference `docs/` and `CLAUDE.md` for deeper architectural notes.

## Build, Test, and Development Commands
- `npm run dev`: Launch the Nuxt dev server on `127.0.0.1`.
- `npm run build`: Produce the production bundle.
- `npm run preview`: Inspect the production build locally.
- `npm run test:unit` / `npm run test:unit -- --run path/to/spec`: Run Vitest suites.
- `npm run coverage`: Generate HTML and text coverage reports in `coverage/`.
- `npm run test` or `npx cypress run --spec cypress/e2e/...`: Execute Cypress interactively or headless.
- `npm run lint` / `npm run lint:a11y`: Apply ESLint rules, including Vue accessibility checks.
- `npm run verify`: Type-check then run unit tests; mirrors the pre-commit hook.

## Coding Style & Naming Conventions
TypeScript and Vue single-file components use two-space indentation. Vue components and composables follow `PascalCase` and `useThing` naming; Pinia stores live in `stores/` with `useXStore`. Prefer type-only imports (`import type`) as enforced by ESLint. Run `npx eslint --fix file.vue` for quick fixes. Tailwind classes should stay sorted via the Prettier Tailwind plugin.

## Testing Guidelines
Vitest runs in a `happy-dom` environment with setup in `tests/setup.ts`; keep assertions focused on observable behavior. Maintain ≥80% coverage across lines, branches, functions, and statements as enforced by `vitest.config.ts`. End-to-end specs use the `.spec.cy.ts` suffix; rely on helpers like `setupTestData()` and `loginUser()` from Cypress support, and alias GraphQL operations to guard for status 200 responses.

## Commit & Pull Request Guidelines
Commit history favors concise, imperative subjects (e.g., “Add pinning feature…”). Keep commits scoped and allow the `verify` hook to pass. Pull requests should describe scope, list critical commands run, and link related issues; include screenshots or recordings for UI changes. Confirm you ran `npm run lint` plus relevant tests before requesting review, and surface follow-up tasks in the PR description.

## Agent Collaboration Notes
Read `CLAUDE.md` for nuanced component, testing, and permission guidance. When collaborating asynchronously, cite sections from that guide, call out remaining TODOs explicitly, and prefer incremental patches so automation hooks stay fast.
