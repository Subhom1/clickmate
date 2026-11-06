import { File, UploadType } from "expo-file-system";

/**
 * @typedef {{uri: string, width: number, height: number, mimeType: 'image/jpeg'}} ProcessedProfilePhoto
 * @typedef {{id: string, avatarUrl: string | null}} ProfilePhotoResult
 * @typedef {{save: (userId: string, photo: ProcessedProfilePhoto, onProgress?: (fraction: number) => void) => Promise<ProfilePhotoResult>, remove: (userId: string) => Promise<ProfilePhotoResult>}} ProfilePhotoApi
 * @typedef {{uploadUrl: string, storageReference: string, headers: Record<string, string>}} UploadSession
 */

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export class ProfilePhotoApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProfilePhotoApiError";
  }
}

export class ProfilePhotoApiUnavailableError extends Error {
  constructor() {
    super("Photo upload is unavailable until the profile photo API is connected.");
    this.name = "ProfilePhotoApiUnavailableError";
  }
}

/**
 * Builds the frontend half of a presigned upload contract. The caller must
 * supply authenticated backend operations after their routes are confirmed.
 * No backend endpoint or object-storage credential is embedded here.
 *
 * @param {{createSession: (userId: string, input: {mimeType: string, size: number}) => Promise<UploadSession>, confirm: (userId: string, storageReference: string) => Promise<ProfilePhotoResult>, remove: (userId: string) => Promise<ProfilePhotoResult>, FileClass?: typeof File}} operations
 * @returns {ProfilePhotoApi}
 */
export function createPresignedProfilePhotoApi({ createSession, confirm, remove, FileClass = File }) {
  if (![createSession, confirm, remove].every((operation) => typeof operation === "function")) {
    throw new ProfilePhotoApiError("Profile photo API operations are incomplete.");
  }
  return {
    async save(userId, photo, onProgress) {
      if (!userId || !photo?.uri?.startsWith("file://") || photo.mimeType !== "image/jpeg" ||
          photo.width !== 512 || photo.height !== 512) {
        throw new ProfilePhotoApiError("The processed profile photo is invalid.");
      }
      const file = new FileClass(photo.uri);
      if (!file.exists || !Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_PHOTO_BYTES) {
        throw new ProfilePhotoApiError("The profile photo must be a file smaller than 2 MB.");
      }
      onProgress?.(0);
      const session = await createSession(userId, { mimeType: photo.mimeType, size: file.size });
      if (!session?.uploadUrl?.startsWith("https://") || !session.storageReference ||
          !session.headers || typeof session.headers !== "object" || Array.isArray(session.headers)) {
        throw new ProfilePhotoApiError("The upload session is invalid.");
      }
      onProgress?.(0.1);
      const response = await file.upload(session.uploadUrl, {
        httpMethod: "PUT",
        uploadType: UploadType.BINARY_CONTENT,
        mimeType: photo.mimeType,
        headers: session.headers,
        sessionType: "foreground",
        onProgress: ({ bytesSent, totalBytes }) => {
          if (totalBytes > 0) {
            const fraction = Math.max(0, Math.min(1, bytesSent / totalBytes));
            onProgress?.(0.1 + fraction * 0.8);
          }
        },
      });
      if (response.status < 200 || response.status >= 300) {
        throw new ProfilePhotoApiError("The photo transfer failed. Please try again.");
      }
      onProgress?.(0.9);
      const result = await confirm(userId, session.storageReference);
      if (result?.id !== userId || !result.avatarUrl || typeof result.avatarUrl !== "string") {
        throw new ProfilePhotoApiError("The updated profile photo was not returned.");
      }
      onProgress?.(1);
      return result;
    },
    async remove(userId) {
      if (!userId) throw new ProfilePhotoApiError("Missing user ID.");
      const result = await remove(userId);
      if (result?.id !== userId || result.avatarUrl !== null) {
        throw new ProfilePhotoApiError("Photo removal was not confirmed.");
      }
      return result;
    },
  };
}

/** @type {ProfilePhotoApi} */
export const profilePhotoApi = {
  async save() {
    throw new ProfilePhotoApiUnavailableError();
  },
  async remove() {
    throw new ProfilePhotoApiUnavailableError();
  },
};
