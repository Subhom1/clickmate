# Frontend tests

Tests live under `tests/` and are grouped by the part of the app they exercise.
This keeps the suite discoverable without mixing test files into production
folders, while preserving a clear relationship to `app/`.

```text
tests/
  setup/          Jest and React Native Testing Library setup
  helpers/        Shared render helpers and test utilities
  fixtures/       Small, deterministic test data
  mocks/          Firebase, HTTP, and socket service mocks
  components/     Reusable UI component behavior
  screens/        Screen behavior, grouped by feature
    auth/
    explore/
    profile/
    chat/
    call/
  state/          Jotai atoms and state transitions
  integration/    Flows that cross screen or service boundaries
```

## Conventions

- Name files after the component or behavior, using `*.test.js` or
  `*.test.jsx` (for example, `screens/chat/MessageInputBox.test.js`).
- Group tests by feature, and keep each test focused on observable behavior.
- Put shared setup in `setup/`, reusable render utilities in `helpers/`, and
  stable test data or service doubles in `fixtures/` and `mocks/`.
- Prefer accessible queries such as role and visible text over implementation
  details or snapshots.
- Mock network, Firebase, and socket boundaries so tests remain deterministic
  and do not require a running backend.

## Commands

- `npm run test:all` runs every frontend test once, serially.
- `npm test -- --runInBand` runs the suite once.
- `npm run test:watch` starts Jest watch mode.
- `npm run test:coverage -- --runInBand` runs the suite with coverage.

## Sprint infrastructure

- `helpers/renderWithProviders.jsx` renders with a new Jotai store by default.
  Pass `{ store }` to seed state or share state across an integration flow.
- `mocks/socket.js` supplies an opt-in socket double. Client `emit` records calls;
  `serverEmit` delivers events to registered listeners. Create a new instance per
  test. Mock the socket factory in the feature test, not globally.
- The Expo transform allowlist includes Jotai because the installed version ships
  ES modules. Keep the Expo entries when updating this list.
- Mock FirebaseConfig at the module boundary in screen/context tests; never
  import local FirebaseSecret configuration or call live services.
- `SPRINT.md` tracks all production modules and the seven daily feature areas.
- `.github/workflows/frontend-tests.yml` runs the regression suite for PRs to main
  and pushes to main using Node 22 and `npm ci`.

Day 1 focused validation:

```sh
npm test -- --runInBand tests/components/InitialsCircle.test.jsx tests/infrastructure/helpers.test.jsx
```

Full regression and optional coverage:

```sh
npm run test:all
npm run test:coverage -- --runInBand
```

Coverage explicitly includes the app shell, entry point, service configuration,
and every module in `app/`, even when a module has no tests yet. Coverage output
is ignored by Git. Coverage reporting does not imply checklist completion.


Day 3 discovery focused validation (Explore, ExploreSearch, Result, People):

```sh
npm test -- --runInBand tests/screens/explore
```
