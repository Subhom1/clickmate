# Frontend coverage audit — 2026-11-01

Command: `npm run test:coverage -- --runInBand`.
Result: 23 suites / 102 tests passed, including six new Day 7 cases.
Overall: 96.03% statements, 83.39% branches, 89.22% functions, 96.53% lines.

The inventory includes every frontend runtime source file, including zero-hit
files. All 26 executable modules have real implementation behavior coverage.
CallScreen has no executable statements; N/A means no instrumented code, not a
passing call feature test. No secret configuration is included in this report.

| Module | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| App.jsx | 100.00% | N/A | 100.00% | 100.00% |
| AuthContext.jsx | 100.00% | 100.00% | 100.00% | 100.00% |
| FirebaseConfig.js | 100.00% | N/A | N/A | 100.00% |
| _layout.jsx | 87.50% | 62.50% | 63.64% | 87.50% |
| app/components/CarouselComp.js | 83.33% | 50.00% | 75.00% | 83.33% |
| app/components/CreateAvatar.js | 100.00% | 100.00% | 100.00% | 100.00% |
| app/components/ToggleSwitch.js | 100.00% | 50.00% | 50.00% | 100.00% |
| app/screens/CallScreen.jsx | N/A | N/A | N/A | N/A |
| app/screens/ChatScreen/ChatScreen.jsx | 96.43% | 87.50% | 94.74% | 98.08% |
| app/screens/ChatScreen/Header.js | 100.00% | 50.00% | 100.00% | 100.00% |
| app/screens/ChatScreen/MessageInputBox.js | 78.95% | N/A | 55.56% | 88.24% |
| app/screens/ChatScreen/MessagesList.js | 92.31% | 100.00% | 83.33% | 92.31% |
| app/screens/Explore.jsx | 100.00% | 90.00% | 100.00% | 100.00% |
| app/screens/ExploreSearch.jsx | 95.45% | 78.57% | 88.89% | 95.45% |
| app/screens/Home.jsx | 96.72% | 80.56% | 91.67% | 96.67% |
| app/screens/Login.jsx | 100.00% | 87.50% | 100.00% | 100.00% |
| app/screens/People.jsx | 100.00% | 75.00% | 100.00% | 100.00% |
| app/screens/Profile.jsx | 98.39% | 92.86% | 96.30% | 98.25% |
| app/screens/Result.jsx | 100.00% | 100.00% | 100.00% | 100.00% |
| app/screens/SignUp.jsx | 96.43% | 88.89% | 86.67% | 96.43% |
| app/screens/VisitorProfile.jsx | 90.00% | 100.00% | 83.33% | 90.00% |
| app/state/atoms/ChatState.js | 100.00% | N/A | N/A | 100.00% |
| app/state/atoms/ExploreState.js | 100.00% | N/A | N/A | 100.00% |
| app/state/atoms/MatchState.js | 100.00% | N/A | N/A | 100.00% |
| app/state/atoms/UserState.js | 100.00% | N/A | N/A | 100.00% |
| constant.js | 100.00% | N/A | N/A | 100.00% |
| index.js | 100.00% | N/A | N/A | 100.00% |

Limits: tests replace native navigation, Firebase SDKs, sockets and HTTP with
doubles. Integration cases mount actual screens and preserve real Jotai state
across route changes. Navigation icon callbacks, native layout callbacks, some
service error branches and disabled ToggleSwitch branches remain uncovered.
The report does not claim complete branch coverage or browser/device end-to-end
validation. Re-run the command to generate the ignored HTML report at
`coverage/lcov-report/index.html`. All production files are unchanged.
