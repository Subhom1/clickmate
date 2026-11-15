# Frontend audit — 15 November 2026

## Scope

Reviewed the Expo app entry point, authentication, navigation, every screen and component under `app/`, shared atoms, profile photo code, frontend tests, and the GitHub Actions test workflow. This was a source and automated test audit. Native device and live backend behavior still need a manual pass.

## Changes in this cleanup

- Use `API_BASE_URL` for discovery, chat, activity images, and account deletion. Release builds can now use the configured HTTPS backend instead of a local development address.
- Keep unread counts in the People screen. A fresh empty response clears old badges without rewriting the shared user profile.
- Put photo selection, upload, removal, and avatar refresh in `useProfilePhotoEditor`; put the photo sheet and its repeated action UI in `ProfilePhotoEditor`. The Profile screen now owns profile editing rather than photo workflow details.
- Share email validation between Login and Sign Up and category labels between Explore and ExploreSearch.
- Remove unused keyboard state/listeners from the message input and remove the message list's own listener on unmount.
- Initialize Firebase with the browser auth API on web; the previous native persistence call crashed before any screen appeared.
- Remove the unused `RootSiblingParent` wrapper. Its package was absent from the manifest and broke clean-install CI.

## Remaining work, by priority

| Priority | Area | Finding | Suggested next step |
| --- | --- | --- | --- |
| High | `app/screens/ChatScreen/ChatScreen.jsx` | The socket effect captures the initial `chatId` and user, has no dependencies, and returns before cleanup when user data is missing. `messagesCleared` is also not unregistered. This can mark the wrong chat as read or leak a socket. | Extract chat connection into a hook with current IDs, explicit ready state, and complete listener cleanup. Cover late user data and screen changes in tests. |
| High | `_layout.jsx` | Navigation reads Firebase's `stsTokenManager.expirationTime` and only recalculates when the user object changes. That is a private field and can become stale after token refresh. | Expose an auth loading/ready state from `AuthProvider` and route from the supported Firebase auth state. |
| Medium | `app/screens/Profile.jsx` | Delete Account calls the backend and Firebase separately, without a confirmation step or an authorization header. A partial failure can leave the two accounts out of sync. | Confirm the backend deletion contract, require reauthentication if needed, add confirmation, then handle partial failures visibly. |
| Medium | `app/components/ToggleSwitch.js`, `app/screens/Result.jsx` | The Global/Local switch does nothing, and the search quota is hard-coded as “1 out of 10 searches left.” Both imply behavior that is absent. | Connect these controls to real backend state or remove them from the UI. |
| Medium | `app/profilePhoto/api.js` | Three upload adapters retain similar photo and file validation, while production currently uses the Mongo adapter. | Once the backend contract is final, remove unused adapters or share their validation helper. |
| Medium | Expo web styling | The exported web app now renders Login, but the browser smoke check showed plain, unstyled text despite NativeWind classes. | Confirm whether web is supported; if so, wire up Tailwind/NativeWind web styles and add a visual smoke check. |
| Medium | `.github/workflows/frontend-tests.yml` | CI runs Jest only. There is no formatting, lint, type, bundle, or device smoke gate. | Add a small formatter/linter gate and an Expo bundle check; keep native smoke steps documented for release testing. |
| Low | `app/screens/CallScreen.jsx`, `app/screens/Result.jsx` | The call screen and some Result actions are entirely commented-out legacy code. | Remove them when the product direction is settled. |

## Verification

- `npm test -- --runInBand` — all 26 suites pass (158 tests).
- `EXPO_PUBLIC_API_BASE_URL=https://api.clickmate.test npx expo export --platform web` — bundle succeeds; local browser loads Login after the Firebase fix.
- `git diff --check` — no whitespace errors.
- Tests cover HTTPS activity URLs and the discovery-to-chat flow, photo editor behavior, unread badge resets, and keyboard listener cleanup.

For a device smoke pass, sign in against a running backend, check activity images, search and chat, open the People tab and clear an unread badge, then replace/remove a profile photo. Use an HTTPS `EXPO_PUBLIC_API_BASE_URL` for a release-like run.
