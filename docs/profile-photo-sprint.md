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
| 5 | Propagate avatars across relevant screens | Complete for supplied avatar URLs; backend mapping and expiry refresh pending |
| 6 | Platform and end-to-end validation, accessibility, error recovery | In progress: frontend validation complete; live storage and photo picker acceptance blocked |
| 7 | Full regression, cleanup, acceptance report | In progress: MongoDB implementation tested; live iPhone upload and restart acceptance pending |

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

## Day 5 continuation (10 November)

- Integrated the current `main` branch, which upgraded to Expo SDK 58 and React Native 0.88. Resolved package conflicts using Expo SDK 58 recommended versions for image picker, image manipulator, and file system. The merged baseline passed 130 tests before the avatar changes.
- Added the shared `InitialsCircle` avatar to People, visitor profile, search result, and chat messages. Existing profile and tab avatars already use it. Initials remain the fallback when no URL is supplied.
- The backend now documents authenticated multipart `POST /v1/me/avatar/uploads`, completion, profile retrieval, and removal routes in `docs/photo-upload-backend-sprint.md` on its main branch. Live storage and database tests remain unverified.
- The merged baseline passed 25 suites / 130 tests; avatar propagation passed 25 suites / 131 tests. iOS and Android JavaScript exports passed on SDK 58. No lint or TypeScript scripts are configured. An iOS simulator was booted by another session and was not disturbed; no Android emulator was attached. Native avatar display was not verified.
- Next priority: adapt the frontend to the confirmed multipart contract and expiring avatar URLs, then run platform acceptance checks.

## User-requested continuation (10 November)

- Verified the backend router is mounted on `main` and uses Firebase bearer authentication. The frontend now requests a signed multipart POST session, sends the processed JPEG with every returned form field, confirms the media ID, retrieves profile avatar metadata, and calls authenticated deletion. The earlier PUT factory remains solely for isolated compatibility tests.
- Production builds require `EXPO_PUBLIC_API_BASE_URL` set to the HTTPS backend origin; the existing LAN HTTP host is used only in Expo development mode. The bearer token is sent only to that backend origin, never the signed object-storage URL.
- The profile avatar is left-aligned above the name. Before upload it shows a round camera-plus placeholder; afterward tapping the photo offers upload or delete. Gallery selection produces the existing true square 512×512 crop and preview before save. Deletion retains its confirmation step.
- Avatar metadata includes the durable media ID and a short-lived read URL. Authentication refreshes it on sign-in, and the profile refreshes near expiry and when foregrounded. Neither URL nor credentials are committed as durable storage.
- Deterministic frontend tests cover the multipart request, signed fields, unsafe session, invalid confirmation, and UI states. All 25 suites / 136 tests pass. The updated app launched on the booted iPhone simulator, but the user-details request failed because the local backend was not listening on port 5051; the authenticated profile and live upload were not visually verified. Screenshot: `/private/tmp/clickmate-profile-new-iphone.png`. Live S3/MongoDB remain unverified.

## Backend contract needed

The backend must specify authenticated endpoints and response fields for:

1. Creating a profile photo upload session (user ID, MIME type, file size),
   returning an HTTPS upload URL, required headers, and storage reference.
2. Confirming the uploaded image and returning updated profile metadata with a
   durable avatar URL or storage reference.
3. Removing the current photo and returning updated profile metadata.
4. Fetching profiles and friend data with avatar metadata after app restart.

The backend main branch documents authenticated avatar routes and the frontend
now calls them. The upload session returns a multipart POST URL and fields;
completion and profile retrieval return an avatar object with a five-minute
private read URL. The client retains the media ID and refreshes that URL. Live
storage/database integration, staging configuration, and device acceptance
still need verification.

## Day 6 continuation (11 November)

- Used the booted iPhone 18 Pro with the logged-in account. The feature build loaded the authenticated profile and showed the left-aligned round camera-plus control. The photo sheet opened. The supplied `person7.jpg` was added to the simulator library. iOS displayed its limited photo-access chooser, but the connected UI controller stopped accepting clicks inside the system picker; crop, preview, upload, replacement, deletion, and persistence were not completed on device. Screenshot: `/private/tmp/clickmate-day6-iphone.png` (Home screen after reload), plus visual inspection of the profile and permission dialog during the run. Android ADB had no connected device.
- Diagnosed the recurring Axios failure in two stages. A stale Expo server used `http://undefined:5051`; launching a separate feature server with the current LAN IP reached the backend. The backend then returned HTTP 401 because its current `GET /user/:email` and `PATCH /user/:userId` require Firebase bearer authentication. The frontend now sends the current ID token for these requests and for authenticated registration. The iPhone profile loaded after the fix.
- Added a development API-host fallback from Expo's Metro host and a shared API origin for the newly authenticated calls. Production requires a configured HTTPS `EXPO_PUBLIC_API_BASE_URL`; local HTTP is limited to development. Profile edits show a visible error and saving state and preserve the confirmed avatar URL.
- The multipart adapter now reports backend 503 messages as an unavailable service; the photo sheet keeps the cropped draft without suggesting an immediate retry. This was verified with isolated negative tests, not a live upload.
- The running backend responds successfully to `/health` and has a MongoDB connection, but its process environment and local `.env` lack `MEDIA_S3_BUCKET` and `MEDIA_S3_REGION`. `createS3Storage` requires both before the upload-session route can succeed. No storage configuration or backend code was changed. Live upload, restart persistence, replacement, deletion, and shared remote-avatar acceptance remain blocked.
- Merged current frontend `main` (commit `63de92b`), which independently introduced Metro host discovery and bearer-token profile loading. Reconciled its tests and retained its preference for the current Metro host over a stale configured IP. The resulting branch passes 25 Jest suites / 144 tests; iOS and Android JavaScript exports both succeeded after the merge. `npm run lint --if-present` and `npm run typecheck --if-present` perform no work because the repository has no such scripts. Existing draft frontend PR #9 remains unmerged pending live acceptance.
- Official SDK 58 environment guidance: https://docs.expo.dev/guides/environment-variables/ . Expo's `expo-constants` `expoConfig.hostUri` is documented at https://docs.expo.dev/versions/v58.0.0/sdk/constants/ .

## Day 7 continuation (12 November)

- The user authorized MongoDB photo storage. A separate backend feature branch
  adds `avatar_files` documents for validated, re-encoded JPEG bytes; users
  retain a small `avatarFileId` pointer. Authenticated upload, metadata, image
  read, and removal routes are implemented. MongoDB was already configured,
  and the isolated backend process reported a healthy database connection on
  port 5052. No Atlas browser setting or secret was changed.
- The frontend now uses a typed MongoDB upload adapter for its 512×512 JPEG,
  maps returned media IDs to authenticated image URLs, displays a fresh Firebase
  token on image requests, and resolves friends' `avatarFileId` in shared
  avatars. The prior S3 adapter remains for compatibility but is not the
  production frontend path on this branch.
- Backend unit and syntax checks passed (168 tests). Frontend Jest passed
  25 suites / 149 tests. iOS, Android, and web JavaScript exports passed. No
  lint or TypeScript check scripts are configured in the frontend repository.
- The feature Expo app launched on the logged-in iPhone 18 Pro, loaded the
  profile from the healthy local backend, and opened the gallery. The supplied
  portrait appeared in Apple's picker. The computer controller could not click
  inside that system picker (`noWindowsAvailable`), so the user was asked to
  complete selection and save. Upload, replacement, removal, restart
  persistence, and remote avatars are not yet device accepted. Android ADB
  could not start in this environment. Do not merge or claim production
  readiness until the live flow and backend deployment are verified.
- Backend API details: `clickmate-backend/docs/mongodb-avatar-storage.md` on
  the companion feature branch. Official references:
  [MongoDB GridFS threshold](https://www.mongodb.com/docs/manual/core/gridfs/),
  [Expo SDK 58 FileSystem](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/).

## References

- [Expo SDK 57 ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)
- [Expo SDK 57 ImageManipulator](https://docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/)
- [Expo FileSystem upload API](https://docs.expo.dev/versions/latest/sdk/filesystem/)
