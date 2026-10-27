# Frontend regression sprint

A day advances only after focused tests, full regression tests, and the PR merge
are verified. One day is attempted per scheduled run. A blocked day resumes
before the next day begins. Coverage of a module means behavior tests exercise
its real implementation; a mocked import does not close a checklist gap.

## Seven-day rollout

Use a dedicated feature test branch and PR to main for each scheduled day.
Advance only after focused tests, the full suite, CI, and merge verification pass.
Existing later-day branches are drafts of future work, not completed sprint days.

| Day | Feature area | Status |
| --- | --- | --- |
| 1 | Infrastructure, helpers and avatar smoke coverage | Complete: PR #2 merged and verified |
| 2 | Authentication: Login, SignUp, AuthContext | 17 focused / 30 total passed; CI and merge pending |
| 3 | Discovery: Explore, ExploreSearch, Result, People | Pending |
| 4 | Profiles and home: Profile, VisitorProfile, Home | Pending |
| 5 | Messaging: ChatScreen, Header, MessagesList, MessageInputBox, ChatState | Pending |
| 6 | Call screen, shared UI, remaining state, app shell | Pending |
| 7 | Checklist gaps, integration, regression and coverage audit | Pending |

## Production module checklist

Only CreateAvatar has behavior coverage at the start of this sprint. Recheck it
on Day 6 along with the other shared components. Every module must be verified
again on Day 7. Add newly discovered production modules here.

| Module | Planned day | Behavior coverage | Day 7 verified |
| --- | --- | --- | --- |
| App.jsx | 6 | Pending | No |
| AuthContext.jsx | 2 | 4 provider/session cases | No |
| _layout.jsx | 6 | Pending | No |
| index.js | 6 | Pending (Expo registration) | No |
| FirebaseConfig.js | 7 | Pending (mock Firebase SDK, never load secrets) | No |
| constant.js | 6 | Pending (environment configuration) | No |
| app/components/CarouselComp.js | 6 | Pending | No |
| app/components/CreateAvatar.js | 1, 6 | 7 behavior cases | No |
| app/components/ToggleSwitch.js | 6 | Pending | No |
| app/screens/Home.jsx | 4 | Pending | No |
| app/screens/Explore.jsx | 3 | Pending | No |
| app/screens/ExploreSearch.jsx | 3 | Pending | No |
| app/screens/Result.jsx | 3 | Pending | No |
| app/screens/People.jsx | 3 | Pending | No |
| app/screens/Profile.jsx | 4 | Pending | No |
| app/screens/VisitorProfile.jsx | 4 | Pending | No |
| app/screens/Login.jsx | 2 | 6 validation, loading, failure/retry and navigation cases | No |
| app/screens/SignUp.jsx | 2 | 7 validation, pending, rejection and registration cases | No |
| app/screens/CallScreen.jsx | 6 | Comment-only file; verify no runtime implementation | No |
| app/screens/ChatScreen/ChatScreen.jsx | 5 | Pending | No |
| app/screens/ChatScreen/Header.js | 5 | Pending | No |
| app/screens/ChatScreen/MessagesList.js | 5 | Pending | No |
| app/screens/ChatScreen/MessageInputBox.js | 5 | Pending | No |
| app/state/atoms/ChatState.js | 5 | Pending | No |
| app/state/atoms/MatchState.js | 6 | Pending | No |
| app/state/atoms/UserState.js | 6 | Pending | No |
| app/state/atoms/ExploreState.js | 6 | Pending | No |

Build configuration (Babel, Metro, Tailwind, app.json) is not a frontend runtime
module. FirebaseSecret.js is local configuration and must never enter a test,
coverage artifact, or commit.

## Day 1 cases

Baseline: 1 suite / 1 test, the existing uppercase-initials smoke test.

Added 6 CreateAvatar cases: single name, empty name, updated name, focused
navigation color, unfocused navigation color, caller background outside navigation.

Added 6 infrastructure cases: seeded provider state, independent provider state,
incoming socket payload routing, outgoing messages without local echo, targeted
listener removal, and disconnect cleanup. These exercise reusable helpers; they
do not count as coverage of production socket consumers or state atom modules.

Use `tests/README.md` for commands. Record actual final results and the verified
merge in automation memory; do not mark this day complete before merge.

Local validation on 2026-10-26: focused command passed 2 suites / 13 tests;
full regression passed 2 suites / 13 tests; coverage passed 2 suites / 13 tests.
CreateAvatar: 100% statements, branches, functions, and lines. Overall statement
coverage: 1.58%. `git diff --check` passed. New cases: 12; existing cases: 1.

## Day 2 authentication

The existing authentication branch contained 11 unmerged cases. This scheduled
run adds 6 distinct cases: Login pending state and rejection/retry; SignUp pending
account creation and rejection without backend registration; AuthContext signed-out
callback without fetching and profile-fetch failure preserving the auth session.
AuthContext now uses isolated real Jotai stores. No production/UI changes.

Day 2 introduces 17 authentication cases relative to main: Login 6, SignUp 7,
AuthContext 4. Existing baseline: 13 tests. Expected full suite: 30 tests.
FirebaseConfig is mocked at consumer boundaries; direct initialization coverage
remains a Day 7 checklist gap using mocked secrets and SDKs.

Validation on 2026-10-27: `npm test -- --runInBand tests/screens/auth`
passed 2 suites / 17 tests; `npm run test:all` passed 4 suites / 30 tests;
`git diff --check` passed. CI and merge verification are recorded in automation
memory after completion. No coverage or visual checks were run for Day 2.
