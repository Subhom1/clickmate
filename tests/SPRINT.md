# Frontend regression sprint

Each step advances after its focused tests and the full regression suite pass.
The branches are stacked in order so each pull request can target the preceding
step. Track pull request merges separately. Coverage of a module means behavior
tests exercise its real implementation; a mocked import does not close a checklist gap.

## Five-PR rollout plan

Each step gets a separate `test/<feature-area>-regression` branch and a focused
commit. Run the focused tests and `npm run test:all` before pushing each step.
Each branch builds on the previous step. Set each pull request base to the preceding
branch so the diff contains only that step; CI runs for pull requests to any base.
The author will open the pull requests after reviewing their generated bodies.

| PR | Feature area | Status |
| --- | --- | --- |
| 1 | Authentication: Login, SignUp, AuthContext | Pushed (`test/frontend-auth-regression`; base `main`) |
| 2 | Discovery: Explore, ExploreSearch, Result, People | Pushed (`test/frontend-discovery-regression`; base PR 1) |
| 3 | Profiles and home: Profile, VisitorProfile, Home | Pushed (`test/frontend-profile-regression`; base PR 2) |
| 4 | Messaging: ChatScreen, Header, MessagesList, MessageInputBox, ChatState | Pushed (`test/frontend-chat-regression`; base PR 3) |
| 5 | Shared UI, remaining state, app shell, integration and final audit | Ready to push (`test/frontend-shell-regression`; base PR 4) |

## Production module checklist

The final audit checks the complete suite and records modules that cannot be
exercised directly because they load local secrets or contain no runtime code.

| Module | Planned PR | Behavior coverage | Final audit |
| --- | --- | --- | --- |
| App.jsx | 5 | Auth/platform context integration | Complete |
| AuthContext.jsx | 1 | 2 provider cases | Complete |
| _layout.jsx | 5 | Authentication gate, tab routes, platform params | Complete |
| index.js | 5 | Expo root registration | Complete |
| FirebaseConfig.js | 1 | Mocked at consumer boundaries; not directly imported to protect local secrets | N/A |
| constant.js | 5 | Public IP environment present and absent | Complete |
| app/components/CarouselComp.js | 5 | Activity selection callback | Complete |
| app/components/CreateAvatar.js | 1, 5 | 7 behavior cases | Complete |
| app/components/ToggleSwitch.js | 5 | Default Global selection | Complete |
| app/screens/Home.jsx | 3 | 5 search/socket cases | Complete |
| app/screens/Explore.jsx | 2 | 3 screen cases | Complete |
| app/screens/ExploreSearch.jsx | 2 | 4 socket/search cases | Complete |
| app/screens/Result.jsx | 2 | 3 match/chat cases | Complete |
| app/screens/People.jsx | 2 | 3 friends/unread cases | Complete |
| app/screens/Profile.jsx | 3 | 4 profile/edit/account cases | Complete |
| app/screens/VisitorProfile.jsx | 3 | 2 visitor profile cases | Complete |
| app/screens/Login.jsx | 1 | 4 validation/navigation cases | Complete |
| app/screens/SignUp.jsx | 1 | 5 validation/register cases | Complete |
| app/screens/CallScreen.jsx | 5 | Comment-only file; no runtime implementation | N/A |
| app/screens/ChatScreen/ChatScreen.jsx | 4 | History, live messaging, clear, navigation, cleanup | Complete |
| app/screens/ChatScreen/Header.js | 4 | Back and clear actions | Complete |
| app/screens/ChatScreen/MessagesList.js | 4 | Incoming/outgoing messages and avatar | Complete |
| app/screens/ChatScreen/MessageInputBox.js | 4 | Submit and clear input | Complete |
| app/state/atoms/ChatState.js | 4 | Covered in ChatScreen | Complete |
| app/state/atoms/MatchState.js | 2 | Covered in ExploreSearch | Complete |
| app/state/atoms/UserState.js | 5 | Exercised through consumer screens | Complete |
| app/state/atoms/ExploreState.js | 2 | Loaded through Explore | Complete |

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

Use `tests/README.md` for commands. Keep each PR marked ready only after focused and
full regression runs pass. Track merges separately from local test completion.

Local validation on 2026-10-26: focused command passed 2 suites / 13 tests;
full regression passed 2 suites / 13 tests; coverage passed 2 suites / 13 tests.
CreateAvatar: 100% statements, branches, functions, and lines. Overall statement
coverage: 1.58%. `git diff --check` passed. New cases: 12; existing cases: 1.


PR 2 focused validation on 2026-10-26: discovery tests passed 4 suites / 13 tests;
full regression passed 8 suites / 37 tests; `git diff --check` passed.

PR 3 focused validation on 2026-10-26: profile and home tests passed 3 suites / 11 tests;
full regression passed 11 suites / 48 tests; `git diff --check` passed.

PR 4 focused validation on 2026-10-26: chat tests passed 2 suites / 5 tests;
full regression passed 13 suites / 53 tests; `git diff --check` passed.

PR 5 final validation on 2026-10-26: full regression passed 19 suites / 61 tests;
coverage passed 19 suites / 61 tests with 90.89% statements, 78.65% branches,
82.03% functions, and 91.64% lines. The report shows FirebaseConfig.js at 0%
because tests deliberately mock it rather than load FirebaseSecret.js; CallScreen.jsx
contains comments only and has no runtime implementation. `git diff --check` passed.
