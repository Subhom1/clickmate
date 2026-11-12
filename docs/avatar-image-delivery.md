# Adaptive avatar images

Profile photos are cropped locally to 512×512 JPEG at 80% quality before
upload. The frontend rejects processed files above 2 MiB. The MongoDB backend
validates and re-encodes them, caps stored originals at 512px, and serves
128px, 256px, and 512px JPEG versions through the authenticated image route.

The shared avatar component estimates visible pixels from its layout width
and React Native `PixelRatio`. Small icons begin at 128px; large profile
photos begin at 256px. When the first image loads within 800 ms, the component
requests the smallest variant that covers the device's pixel density (up to
512px). A slow first load stays at the smaller image, reducing transfer on a
slow connection. A failed high-resolution request falls back to the smaller
version. Other image URLs retain their existing behavior.

Load time is an observed connection signal, not an exact bandwidth test. It
also includes cache and server latency. The approach avoids introducing a
network-state package solely to guess speed from Wi-Fi or cellular labels.
The backend's private cache header allows a repeated view to reuse image
bytes where supported by the platform.

References: [React Native PixelRatio](https://reactnative.dev/docs/pixelratio),
[Expo SDK 58 Network](https://docs.expo.dev/versions/v58.0.0/sdk/network/).
