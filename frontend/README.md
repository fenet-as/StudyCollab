# StudyCollab Frontend

The frontend client for StudyCollab, built with React 19, Vite, and modern CSS modules.

## Scripts & Development

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local development server with HMR. |
| `npm run build` | `vite build` | Compiles production bundle with code-splitting and asset optimization. |
| `npm run preview` | `vite preview` | Previews the production build locally. |
| `npm run lint` | `eslint .` | Runs ESLint with zero-tolerance for syntax errors and warnings. |
| `npm test` | `node --test tests/**/*.test.js` | Runs automated regression test suite natively via Node test runner. |
| `npm run test:watch` | `node --test --watch tests/**/*.test.js` | Runs test suite in watch mode on file modifications. |
| `npm run test:coverage`| `node --test --experimental-test-coverage tests/**/*.test.js` | Generates detailed line, branch, and function code coverage metrics. |

---

## Automated Testing Suite

The test suite resides in `frontend/tests/` and provides automated regression coverage across critical user workflows, API contracts, security checks, and accessibility standards:

- **`apiIntegration.test.js`**: Contract validation, HTTP methods, payloads, query parameters, and error propagation for `authApi`, `notesApi`, `tasksApi`, `filesApi`, `userApi`, `groupApi`, and `groupOverviewApi`.
- **`authInterceptor.test.js`**: Token lifecycle, Authorization header attachment, 401 response handling, refresh queue serialization, infinite loop prevention, and session expiration broadcast.
- **`groupContext.test.js`**: Group state management, active group resolution, creation, deletion, leaving, and updating.
- **`notesDraftProtection.test.js`**: Unsaved edits protection, dirty state indicators, background synchronization isolation, and note switching history preservation.
- **`accessibilityStylesheets.test.js`**: Keyboard navigation (`Enter`/`Space`), semantic `<button>` controls, `role="tab"`, `aria-selected`, `aria-label`, visible `:focus-visible` outlines, and dead stylesheet verification.
- **`htmlUtils.test.js`**: HTML entity escaping, XSS sanitization, PDF export sanitization, and popup lifecycle handling.
- **`inviteCode.test.js`**: Invite link regeneration, permission authorization, and UI dialog workflows.
- **`routeLoading.test.js`**: Code splitting, `React.lazy` chunk separation, fallback rendering, and DEV-only test route gating.
- **`eslintFixes.test.js`**: Codebase-wide lint validation and hook safety.

---

## Continuous Integration (CI/CD)

GitHub Actions workflow is configured in `.github/workflows/ci-cd.yml`:

- **Triggers**: Every pull request and push targeting the `main` branch.
- **Automated Frontend Checks**:
  1. `npm ci`: Clean install of dependencies.
  2. `npm run lint`: Validates code style and rules.
  3. `npm test`: Executes 130+ unit and integration tests.
  4. `npm run build`: Validates production bundle compilation.

---

## Tooling Evaluation & Roadmap

- **Node.js Test Runner (`node:test`)**: Currently adopted for unit and integration suites due to zero extra dependencies, instantaneous execution (<4s), native ESM support, and built-in code coverage reporting.
- **Vitest & React Testing Library**: Evaluated and recommended for deep component DOM rendering and simulated user clicks as React component trees evolve.
- **Mock Service Worker (MSW)**: Evaluated for full network-level API mocking in browser-like environments.
- **Playwright**: Evaluated for multi-browser end-to-end testing covering full user journeys (authentication -> group collaboration -> markdown notes -> PDF export).
