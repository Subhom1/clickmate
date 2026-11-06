import { profilePhotoApi, ProfilePhotoApiUnavailableError } from "../../app/profilePhoto/api";
import { createMockProfilePhotoApi } from "../mocks/profilePhotoApi";

it("does not claim production upload or removal without a backend contract", async () => {
  await expect(profilePhotoApi.save("me-1", { uri: "file://avatar.jpg", width: 512, height: 512, mimeType: "image/jpeg" }))
    .rejects.toBeInstanceOf(ProfilePhotoApiUnavailableError);
  await expect(profilePhotoApi.remove("me-1")).rejects.toBeInstanceOf(ProfilePhotoApiUnavailableError);
});

it("keeps mock upload and removal isolated from the production adapter", async () => {
  const mock = createMockProfilePhotoApi();
  const progress = jest.fn();
  await expect(mock.save("me-1", { uri: "file://avatar.jpg", width: 512, height: 512 }, progress))
    .resolves.toEqual({ id: "me-1", avatarUrl: "https://mock.invalid/avatar.jpg" });
  expect(progress.mock.calls).toEqual([[0.5], [1]]);
  await expect(mock.remove("me-1")).resolves.toEqual({ id: "me-1", avatarUrl: null });
  await expect(mock.save("", null)).rejects.toThrow("Invalid profile photo upload request.");
});
