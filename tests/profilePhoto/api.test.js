import { profilePhotoApi, ProfilePhotoApiUnavailableError, ProfilePhotoApiError, createPresignedProfilePhotoApi } from "../../app/profilePhoto/api";
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

const photo = { uri: "file://avatar.jpg", width: 512, height: 512, mimeType: "image/jpeg" };
const session = { uploadUrl: "https://storage.example/upload", storageReference: "avatars/me-1", headers: { "Content-Type": "image/jpeg" } };
let fileSize;
let upload;
let createSession;
let confirm;
let remove;
function FakeFile() {
  this.exists = true;
  this.size = fileSize;
  this.upload = upload;
}

beforeEach(() => {
  fileSize = 1000;
  upload = jest.fn().mockImplementation(async (_url, options) => {
    options.onProgress({ bytesSent: 500, totalBytes: 1000 });
    return { status: 200 };
  });
  createSession = jest.fn().mockResolvedValue(session);
  confirm = jest.fn().mockResolvedValue({ id: "me-1", avatarUrl: "https://example.com/avatar.jpg" });
  remove = jest.fn().mockResolvedValue({ id: "me-1", avatarUrl: null });
});

const adapter = () => createPresignedProfilePhotoApi({ createSession, confirm, remove, FileClass: FakeFile });

it("validates the local file, uploads with progress, then confirms the profile", async () => {
  const progress = jest.fn();
  await expect(adapter().save("me-1", photo, progress)).resolves.toEqual({ id: "me-1", avatarUrl: "https://example.com/avatar.jpg" });
  expect(createSession).toHaveBeenCalledWith("me-1", { mimeType: "image/jpeg", size: 1000 });
  expect(upload).toHaveBeenCalledWith(session.uploadUrl, expect.objectContaining({
    httpMethod: "PUT", headers: session.headers, mimeType: "image/jpeg", sessionType: "foreground",
  }));
  expect(confirm).toHaveBeenCalledWith("me-1", session.storageReference);
  expect(progress.mock.calls.map(([fraction]) => fraction)).toEqual([0, 0.1, 0.5, 0.9, 1]);
});

it("rejects invalid images and oversized files before requesting a session", async () => {
  await expect(adapter().save("me-1", { ...photo, width: 400 })).rejects.toBeInstanceOf(ProfilePhotoApiError);
  fileSize = 2 * 1024 * 1024 + 1;
  await expect(adapter().save("me-1", photo)).rejects.toThrow("smaller than 2 MB");
  expect(createSession).not.toHaveBeenCalled();
});

it("rejects an unsafe session and never sends the image", async () => {
  createSession.mockResolvedValue({ ...session, uploadUrl: "http://storage.example/upload" });
  await expect(adapter().save("me-1", photo)).rejects.toThrow("upload session is invalid");
  expect(upload).not.toHaveBeenCalled();
  expect(confirm).not.toHaveBeenCalled();
});

it("does not confirm a failed upload or accept an unrelated profile", async () => {
  upload.mockResolvedValue({ status: 403 });
  await expect(adapter().save("me-1", photo)).rejects.toThrow("transfer failed");
  expect(confirm).not.toHaveBeenCalled();
  upload.mockResolvedValue({ status: 200 });
  confirm.mockResolvedValue({ id: "someone-else", avatarUrl: "https://example.com/other.jpg" });
  await expect(adapter().save("me-1", photo)).rejects.toThrow("updated profile photo was not returned");
});

it("requires confirmed removal of the correct user's photo", async () => {
  await expect(adapter().remove("me-1")).resolves.toEqual({ id: "me-1", avatarUrl: null });
  remove.mockResolvedValue({ id: "me-1", avatarUrl: "https://example.com/still-there.jpg" });
  await expect(adapter().remove("me-1")).rejects.toThrow("removal was not confirmed");
  await expect(adapter().remove("")).rejects.toThrow("Missing user ID");
});
