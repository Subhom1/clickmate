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
| 2 | Authentication: Login, SignUp, AuthContext | Complete: PR #3 merged and verified |
| 3 | Discovery: Explore, ExploreSearch, Result, People | Complete: PR #4 merged and verified |
| 4 | Profiles and home: Profile, VisitorProfile, Home | Complete: PR #5 merged and verified |
| 5 | Messaging: ChatScreen, Header, MessagesList, MessageInputBox, ChatState | 13 focused / 79 total passed; CI and merge pending |
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
| app/screens/Home.jsx | 4 | 7 cases: validation, submit/cancel, connection, matches, errors, tags and feedback expiry | No |
| app/screens/Explore.jsx | 3 | 4 cases: loading, category navigation, retry and cache replacement | No |
| app/screens/ExploreSearch.jsx | 3 | 7 cases: socket search, matches, retry, cancellation and cleanup | No |
| app/screens/Result.jsx | 3 | 4 cases: chat creation, missing match, new search and failure/retry | No |
| app/screens/People.jsx | 3 | 4 cases: empty state, friend navigation, unread updates and recovery | No |
| app/screens/Profile.jsx | 4 | 7 cases: display/logout, validation, editing, deletion and failure recovery | No |
| app/screens/VisitorProfile.jsx | 4 | 3 cases: profile/back navigation, missing email and visitor route changes | No |
| app/screens/Login.jsx | 2 | 6 validation, loading, failure/retry and navigation cases | No |
| app/screens/SignUp.jsx | 2 | 7 validation, pending, rejection and registration cases | No |
| app/screens/CallScreen.jsx | 6 | Comment-only file; verify no runtime implementation | No |
| app/screens/ChatScreen/ChatScreen.jsx | 5 | 7 cases: history, send/receive, match exit/cleanup, empty send, server echo, fetched chat ID, failures and clear confirmation | No |
| app/screens/ChatScreen/Header.js | 5 | Back and clear actions plus recipient display | No |
| app/screens/ChatScreen/MessagesList.js | 5 | Incoming/outgoing display and cleared-history replacement | No |
| app/screens/ChatScreen/MessageInputBox.js | 5 | Send/reset and independent successive drafts | No |
| app/state/atoms/ChatState.js | 5 | Session isolation/reset plus fetched chat ID and failed-fetch preservation | No |
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


## Day 3 discovery

Integrated the current main authentication baseline into the existing discovery
branch without rewriting history. Retained 13 draft cases and added 6 new distinct
behaviors this run: Explore replaces cached categories; ExploreSearch clears stale
matches on malformed results, rejects disconnected retry, and exits a disconnected
search without emitting cancellation; Result preserves existing chat state on
failure and retries successfully; People preserves friends on unread-request
failure and recovers through a socket event.

Relative to main: 19 discovery cases (Explore 4, ExploreSearch 7, Result 4,
People 4). Tests use isolated real Jotai stores and explicit mock socket server
events. Consumer tests exercise ExploreState, MatchState, UserState and ChatState
transitions, but their dedicated audit remains on the planned days.

Validation on 2026-10-28: `npm test -- --runInBand tests/screens/explore`
passed 4 suites / 19 tests. `npm run test:all` passed 8 suites / 49 tests.
`git diff --check` passed. CI and verified merge are recorded in automation memory
after completion. No production/UI changes, coverage run or visual check.


## Day 4 profiles and home

Integrated current main into the existing profile branch without rewriting history.
Kept the 11 draft cases and added 6 new behavior cases this run: Profile retains
its session on sign-out failure, preserves edits for update retry, and preserves
the account when backend deletion fails; VisitorProfile reloads on route email
changes and removes old interests; Home submits a suggested tag and clears stale
matches while expiring no-result feedback at ten seconds. Reset profile service
mocks and Firebase currentUser between cases; restore Home fake timers.

Relative to main: 17 new cases (Profile 7, VisitorProfile 3, Home 7).
Validation on 2026-10-29: `npm test -- --runInBand tests/screens/profile tests/screens/home`
passed 3 suites / 17 tests. `npm run test:all` passed 11 suites / 66 tests.
`git diff --check` passed. CI and verified merge are recorded in automation memory
after completion. No production/UI changes, coverage run or visual check.
Days 5–7 remain pending, including the final module and coverage audit.


## Day 5 messaging

Integrated current main into the existing chat branch without rewriting history.
Preserved the five draft cases and added eight distinct cases this run: empty
send rejection, server-confirmed outgoing display without local echo, fetched
chat ID used for sending, history failure preserving selection without joining,
clear confirmation reloading history with toast expiry, successive independent
input drafts, cleared message-list replacement, and ChatState session isolation
with reset. Tests exercise the real ChatScreen, Header, MessagesList,
MessageInputBox and ChatState implementations. Reset HTTP mocks between tests
and restore spies/timers. No production or UI changes.

Relative to main: 13 new messaging cases (ChatScreen 7, chat components 5,
ChatState 1). Eight were written during this run; five came from the draft branch.
Focused validation on 2026-10-30:
`npm test -- --runInBand tests/screens/chat tests/state/ChatState.test.js`
passed 3 suites / 13 tests. `npm run test:all` passed 14 suites / 79 tests.
`git diff --check` passed. No coverage run or visual check was performed.
CI and verified merge are recorded in automation memory after completion.
Days 6–7 remain pending, including the final module and coverage audit.
