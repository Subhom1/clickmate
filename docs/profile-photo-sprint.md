# Profile photo sprint tracker

This tracker belongs to the November 2026 profile photo sprint. Read it before
each scheduled run. Advance to the earliest unfinished item; dates do not by
themselves mark a day complete. Do not confuse this tracker with the earlier
frontend regression sprint in `tests/SPRINT.md`.

| Day | Work | State |
| --- | --- | --- |
| 1 | Discover repository and API; add native selection, square export, preview, cancellation, permissions, tests | Complete with platform and backend blockers noted below |
| 2 | Connect typed upload adapter to a confirmed backend contract, or isolate a mock and document the dependency | Complete as contract-driven adapter; real routes remain blocked |
| 3 | Add upload progress, retries, and replacement flow | Complete as frontend flow; backend and editor simulator checks remain blocked |
| 4 | Add removal flow and persistence refresh | Complete as frontend flow; backend persistence unverified |
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

## Day 2 continuation (6 November, started on request)

- Added `expo-file-system` ~57.0.7 from the local Expo SDK 57 compatibility
  map. `createPresignedProfilePhotoApi` accepts backend operations as inputs;
  no route names, authorization headers, or credentials are fabricated.
- Before requesting a session, the adapter verifies a local 512×512 JPEG file
  exists and is at most 2 MiB. It requires an HTTPS upload URL, the backend's
  storage reference, and its required headers. It uploads binary content via
  `File.upload` using PUT, reports upload progress, and requires a successful
  HTTP response before confirming the upload.
- The displayed avatar changes only after confirmation returns the same user
  ID and a nonempty avatar URL. Failed uploads, invalid sessions and invalid
  confirmation responses leave the existing avatar in place. Removal support
  exists in the adapter and validates the response, but the UI is pending.
- The production adapter still rejects without a confirmed backend contract.
  The test mock remains isolated under `tests/mocks`.
- The profile sheet now reports upload progress. Native transfer progress and
  the response shape are covered by deterministic tests, not a live backend.
- Validation: 25 Jest suites / 121 tests passed; iOS and Android JavaScript
  exports completed; Expo dependency check passed using its offline local map.
  No lint or TypeScript scripts are configured in this JavaScript repository.
- Simulator: iOS Expo Go launched the app and displayed its login screen on
  the booted iPhone 18 Pro. The authenticated profile and photo editor were
  not exercised without a test account. Android ADB reported no attached
  device. Screenshot: `/private/tmp/clickmate-day2-ios.png`.
- Next priority: confirm and wire backend operations, add retry behavior and
  replacement/removal UI, then validate persistence after a fresh login.

## Day 3 continuation (7 November, started on request)

- Reviewed [backend draft PR #14](https://github.com/Subhom1/clickmate-backend/pull/14). It adds `avatarMediaId` and private storage foundations, but explicitly defers authenticated upload sessions, completion, removal, and the frontend endpoint contract. It is unmerged and provides no usable routes. The production frontend adapter remains unavailable.
- The photo sheet now identifies replacement when an avatar exists, keeps the old avatar throughout failed attempts, offers a retry with the same processed file after a recoverable save failure, and avoids offering a retry for the known unavailable API. A new selection or cancellation clears retry state.
- The UI distinguishes byte transfer progress from final server confirmation, disables duplicate actions while saving, and rejects a save response for a different user.
- Added deterministic tests for retry, picker cancellation during replacement, mismatched response, and the confirmation stage. All 25 Jest suites / 125 tests pass. iOS and Android JavaScript exports pass. This repository has no lint or TypeScript scripts; the `--if-present` checks performed no work.
- iOS: launched ClickMate on a booted iPhone 18 Pro and visually verified the Home screen. The app logged an Axios timeout fetching MongoDB user details, so the authenticated photo editor could not be exercised. Screenshot: `/private/tmp/clickmate-day3-ios.png`. Android: no attached emulator. Neither platform's photo flow is accepted yet.
- Next priority: removal UI and profile refresh behavior, while retaining the explicit backend dependency until endpoints and durable avatar metadata are confirmed.

## Day 4 continuation (9 November)

- Added an explicit two-step photo removal control. Cancellation leaves the avatar intact; a failed or mismatched removal response keeps the confirmation sheet and current avatar. A confirmed response updates the shared user atom to `avatarUrl: null`.
- The auth profile fetch already restores avatar metadata from the existing user response. It now clears cached profile state on sign-out and ignores a profile response arriving after sign-out, preventing a stale avatar from reappearing.
- Added positive and negative removal tests and auth restoration/race tests. The isolated worktree passed 25 Jest suites / 130 tests. iOS and Android JavaScript exports passed after linking the ignored local Firebase configuration for bundling. No secret was staged.
- No lint or TypeScript scripts are configured. No Android emulator was attached; no iOS simulator was booted. Native removal behavior remains unverified.
- The production removal API still reports unavailable because the backend endpoint and durable avatar response are not confirmed. Next: shared avatars across relevant screens.

## Backend contract needed

The backend must specify authenticated endpoints and response fields for:

1. Creating a profile photo upload session (user ID, MIME type, file size),
   returning an HTTPS upload URL, required headers, and storage reference.
2. Confirming the uploaded image and returning updated profile metadata with a
   durable avatar URL or storage reference.
3. Removing the current photo and returning updated profile metadata.
4. Fetching profiles and friend data with avatar metadata after app restart.

No such endpoints are assumed to exist. Until confirmed, the Save action gives
an explicit unavailable message and does not change profile state or claim a
successful upload. A local preview is not persistent.

The expected adapter interface is `createSession(userId, {mimeType, size})`,
`confirm(userId, storageReference)`, and `remove(userId)`. `createSession` must
return `{uploadUrl, storageReference, headers}`. `confirm` must return
`{id, avatarUrl}` for the same user. `remove` must return `{id, avatarUrl: null}`.
The endpoint paths, authentication mechanism, storage response codes, and
durable avatar field name require backend confirmation before wiring.

## References

- [Expo SDK 57 ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)
- [Expo SDK 57 ImageManipulator](https://docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/)
- [Expo FileSystem upload API](https://docs.expo.dev/versions/latest/sdk/filesystem/)
