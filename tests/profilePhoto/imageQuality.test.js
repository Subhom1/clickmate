import { initialAvatarSize, shouldUpgradeAvatar, targetAvatarSize } from "../../app/profilePhoto/imageQuality";

it("matches visible pixels to the smallest useful variant", () => {
  expect(targetAvatarSize(30, 3)).toBe(128);
  expect(targetAvatarSize(72, 3)).toBe(256);
  expect(targetAvatarSize(88, 3)).toBe(512);
  expect(targetAvatarSize(200, 4)).toBe(512);
  expect(initialAvatarSize(512)).toBe(256);
  expect(initialAvatarSize(256)).toBe(128);
});

it("upgrades only after a fast, valid first transfer", () => {
  expect(shouldUpgradeAvatar(128, 256, 200)).toBe(true);
  expect(shouldUpgradeAvatar(256, 512, 799)).toBe(true);
  expect(shouldUpgradeAvatar(256, 512, 1200)).toBe(false);
  expect(shouldUpgradeAvatar(512, 512, 200)).toBe(false);
  expect(shouldUpgradeAvatar(128, 256, NaN)).toBe(false);
});
