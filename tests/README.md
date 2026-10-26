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

- `npm test -- --runInBand` runs the suite once.
- `npm run test:watch` starts Jest watch mode.
- `npm run test:coverage -- --runInBand` runs the suite with coverage.
