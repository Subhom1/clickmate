export const AVATAR_SIZES = [128, 256, 512];
export const FAST_IMAGE_LOAD_MS = 800;

// Display points multiplied by the device scale estimate the visible pixels.
export function targetAvatarSize(layoutPoints, pixelRatio) {
  const points = Number(layoutPoints);
  const ratio = Number(pixelRatio);
  const pixels = (Number.isFinite(points) && points > 0 ? points : 40) *
    (Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
  return AVATAR_SIZES.find(size => size >= pixels) ?? 512;
}

export function initialAvatarSize(target) {
  return target === 512 ? 256 : 128;
}

export function shouldUpgradeAvatar(current, target, loadMs) {
  return current < target && Number.isFinite(loadMs) && loadMs >= 0 && loadMs <= FAST_IMAGE_LOAD_MS;
}
