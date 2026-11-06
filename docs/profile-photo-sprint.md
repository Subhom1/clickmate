# Profile photo sprint tracker

This tracker belongs to the November 2026 profile photo sprint. Read it before
each scheduled run. Advance to the earliest unfinished item; dates do not by
themselves mark a day complete. Do not confuse this tracker with the earlier
frontend regression sprint in `tests/SPRINT.md`.

| Day | Work | State |
| --- | --- | --- |
| 1 | Discover repository and API; add native selection, square export, preview, cancellation, permissions, tests | Complete with platform and backend blockers noted below |
| 2 | Connect typed upload adapter to a confirmed backend contract, or isolate a mock and document the dependency | Pending |
| 3 | Add upload progress, retries, and replacement flow | Pending |
| 4 | Add removal flow and persistence refresh | Pending |
| 5 | Propagate avatars across relevant screens | Pending |
| 6 | Platform and end-to-end validation, accessibility, error recovery | Pending |
| 7 | Full regression, cleanup, acceptance report | Pending |

## Day 1 findings

- Repository: Expo SDK 57.0.27, React Native 0.86.3, React 19.2.3, npm lockfile.
- Navigation: React Navigation tabs inside the current Expo shell. Profile state:
  Jotai `userState`, loaded from `GET /user/:email` by `AuthContext`.
- Existing user edits: `PATCH /user/:id`; no frontend image upload or removal
  API contract found. Firebase Auth is used for sign-in, but existing Axios
  profile requests do not attach an ID token. No React Query cache exists.
- Current profile avatar is initials. `avatarUrl` is a proposed frontend display
  field only; its backend response shape remains unconfirmed.
- CI runs `npm test -- --runInBand`. No lint script, TypeScript configuration,
  Detox, Maestro, or native end-to-end command is configured.
- Expo SDK 57 recommends `expo-image-picker` ~57.0.21 and
  `expo-image-manipulator` ~57.0.22. Its native editor crops on both platforms,
  but Android offers rotation while iOS offers crop only. Expo documents an iOS
  native crop rectangle issue with some high-resolution photos. The exported
  file is inspected as the actual preview, and any non-square native output is
  center-cropped before resizing. Native behavior still needs device testing.
- Day 1 focused and full Jest suites passed. Expo's installed-dependency check
  passed using its local dependency map, with the registry unavailable to that
  check. The iOS JavaScript export bundled successfully. The repository has no
  lint or TypeScript check scripts. Final full suite: 25 suites, 115 tests.
- iOS: a booted iPhone 18 Pro and Expo Go were available. Expo Go failed to
  connect to the local Metro server; the app and editor were not visually
  verified. Android: ADB reported no attached devices. No simulator pass is
  claimed. Screenshot: `/private/tmp/clickmate-day1-ios.png` (Expo Go connection
  error, not an app screenshot).
- Day 1 implementation includes native camera/gallery selection, permission
  handling, 1:1 native crop request, 512px JPEG export, actual exported-file
  preview, cancellation, error feedback, and the display path for a future
  `avatarUrl`. The selected preview is transient and is not uploaded.
- `app/profilePhoto/api.js` defines a JSDoc-typed frontend API boundary. Its
  production methods explicitly reject until a backend contract is confirmed.
  `tests/mocks/profilePhotoApi.js` is an isolated deterministic mock and is
  never imported by production code.
- Day 2 priority: confirm API endpoints and auth rules, add a typed real/mock
  adapter boundary, and build upload progress and response handling without
  claiming production integration.

## Backend contract needed

The backend must specify authenticated endpoints and response fields for:

1. Creating a profile photo upload session (user ID, MIME type, file size),
   returning an upload URL, required headers, and storage reference.
2. Confirming the uploaded image and returning updated profile metadata with a
   durable avatar URL or storage reference.
3. Removing the current photo and returning updated profile metadata.
4. Fetching profiles and friend data with avatar metadata after app restart.

No such endpoints are assumed to exist. Until confirmed, the Save action gives
an explicit unavailable message and does not change profile state or claim a
successful upload. A local preview is not persistent.

## References

- [Expo SDK 57 ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)
- [Expo SDK 57 ImageManipulator](https://docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/)
