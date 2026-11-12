import { File, UploadType } from "expo-file-system";
import axios from "axios";
import { Auth } from "../../FirebaseConfig";
import { API_BASE_URL } from "../../constant";

/**
 * @typedef {{uri: string, width: number, height: number, mimeType: 'image/jpeg'}} ProcessedProfilePhoto
 * @typedef {{id: string, avatarUrl: string | null, avatarMediaId?: string | null, avatarExpiresAt?: string | null}} ProfilePhotoResult
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
  constructor(message = "Photo upload is unavailable until the profile photo API is connected.") {
    super(message);
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

/**
 * Implements the backend's authenticated multipart avatar contract. The upload
 * URL receives only the signed form fields and file; the Firebase token goes
 * solely to ClickMate's API.
 */
export function createMultipartProfilePhotoApi({ request, getToken, baseUrl, FileClass = File }) {
  const authenticated = async (method, path, data) => {
    if (!baseUrl?.startsWith("https://") && !(__DEV__ && baseUrl?.startsWith("http://"))) {
      throw new ProfilePhotoApiError("A secure profile photo API URL is required.");
    }
    const token = await getToken();
    if (!token) throw new ProfilePhotoApiError("Please sign in to manage your photo.");
    try {
      const response = await request({ method, url: `${baseUrl}${path}`, data, headers: { Authorization: `Bearer ${token}` } });
      return response.data;
    } catch (error) {
      const message = error?.response?.data?.message;
      if (error?.response?.status === 503) {
        throw new ProfilePhotoApiUnavailableError(message || "Photo service is temporarily unavailable.");
      }
      throw new ProfilePhotoApiError(message || (error?.response ? "The photo request failed. Please try again." : "Could not reach the photo service. Check your connection."));
    }
  };
  const parseAvatar = (avatar) => {
    if (!avatar || typeof avatar.mediaId !== "string" || !avatar.mediaId ||
        typeof avatar.url !== "string" || !avatar.url.startsWith("https://") ||
        !Number.isFinite(Date.parse(avatar.expiresAt)) || Date.parse(avatar.expiresAt) <= Date.now()) {
      throw new ProfilePhotoApiError("The updated profile photo was not returned.");
    }
    return { avatarUrl: avatar.url, avatarMediaId: avatar.mediaId, avatarExpiresAt: avatar.expiresAt };
  };
  return {
    async save(userId, photo, onProgress) {
      if (!userId || !photo?.uri?.startsWith("file://") || photo.mimeType !== "image/jpeg" || photo.width !== 512 || photo.height !== 512) {
        throw new ProfilePhotoApiError("The processed profile photo is invalid.");
      }
      const file = new FileClass(photo.uri);
      if (!file.exists || !Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_PHOTO_BYTES) {
        throw new ProfilePhotoApiError("The profile photo must be a file smaller than 2 MB.");
      }
      onProgress?.(0);
      const session = await authenticated("post", "/v1/me/avatar/uploads", { contentType: photo.mimeType, sizeBytes: file.size });
      if (session?.method !== "POST" || !session.mediaId || !session.uploadUrl?.startsWith("https://") ||
          !session.fields || typeof session.fields !== "object" || Array.isArray(session.fields) ||
          !Object.values(session.fields).every((value) => typeof value === "string") ||
          !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) {
        throw new ProfilePhotoApiError("The upload session is invalid.");
      }
      onProgress?.(0.1);
      const uploaded = await file.upload(session.uploadUrl, {
        httpMethod: "POST", uploadType: UploadType.MULTIPART, fieldName: "file", mimeType: photo.mimeType,
        parameters: session.fields, sessionType: "foreground",
        onProgress: ({ bytesSent, totalBytes }) => {
          if (totalBytes > 0) onProgress?.(0.1 + Math.max(0, Math.min(1, bytesSent / totalBytes)) * 0.8);
        },
      });
      if (uploaded.status < 200 || uploaded.status >= 300) throw new ProfilePhotoApiError("The photo transfer failed. Please try again.");
      onProgress?.(0.9);
      const completed = await authenticated("post", `/v1/me/avatar/uploads/${encodeURIComponent(session.mediaId)}/complete`);
      if (completed?.success !== true) throw new ProfilePhotoApiError("The updated profile photo was not returned.");
      const result = { id: userId, ...parseAvatar(completed.avatar) };
      onProgress?.(1);
      return result;
    },
    async remove(userId) {
      if (!userId) throw new ProfilePhotoApiError("Missing user ID.");
      const result = await authenticated("delete", "/v1/me/avatar");
      if (result?.avatar !== null) throw new ProfilePhotoApiError("Photo removal was not confirmed.");
      return { id: userId, avatarUrl: null, avatarMediaId: null, avatarExpiresAt: null };
    },
    async getProfile() {
      const result = await authenticated("get", "/v1/me/profile");
      return result?.avatar === null ? { avatarUrl: null, avatarMediaId: null, avatarExpiresAt: null } : parseAvatar(result?.avatar);
    },
  };
}

/** Uploads the processed JPEG to ClickMate, which stores its bytes in MongoDB. */
export function createMongoProfilePhotoApi({ request, getToken, baseUrl, FileClass = File }) {
  const authorized = async () => {
    if (!baseUrl?.startsWith("https://") && !(__DEV__ && baseUrl?.startsWith("http://"))) {
      throw new ProfilePhotoApiError("A secure profile photo API URL is required.");
    }
    const token = await getToken();
    if (!token) throw new ProfilePhotoApiError("Please sign in to manage your photo.");
    return { Authorization: `Bearer ${token}` };
  };
  const parse = avatar => {
    if (!avatar?.mediaId || typeof avatar.mediaId !== "string" || avatar.contentType !== "image/jpeg" ||
        !Number.isFinite(avatar.width) || avatar.width !== avatar.height) {
      throw new ProfilePhotoApiError("The updated profile photo was not returned.");
    }
    return { avatarUrl: `${baseUrl}/v1/avatar-files/${encodeURIComponent(avatar.mediaId)}`, avatarMediaId: avatar.mediaId, avatarExpiresAt: null };
  };
  const call = async (method, path) => {
    try {
      const response = await request({ method, url: `${baseUrl}${path}`, headers: await authorized() });
      return response.data;
    } catch (error) {
      if (error instanceof ProfilePhotoApiError) throw error;
      const message = error?.response?.data?.message;
      if (error?.response?.status === 503) throw new ProfilePhotoApiUnavailableError(message || "Photo service is temporarily unavailable.");
      throw new ProfilePhotoApiError(message || "The photo request failed. Please try again.");
    }
  };
  return {
    async save(userId, photo, onProgress) {
      if (!userId || !photo?.uri?.startsWith("file://") || photo.mimeType !== "image/jpeg" || photo.width !== 512 || photo.height !== 512) {
        throw new ProfilePhotoApiError("The processed profile photo is invalid.");
      }
      const file = new FileClass(photo.uri);
      if (!file.exists || !Number.isFinite(file.size) || file.size < 1 || file.size > MAX_PHOTO_BYTES) {
        throw new ProfilePhotoApiError("The profile photo must be a file smaller than 2 MB.");
      }
      const headers = await authorized();
      onProgress?.(0);
      const response = await file.upload(`${baseUrl}/v1/me/avatar-file`, {
        httpMethod: "POST", uploadType: UploadType.MULTIPART, fieldName: "file", mimeType: "image/jpeg", headers,
        sessionType: "foreground", onProgress: ({ bytesSent, totalBytes }) => {
          if (totalBytes > 0) onProgress?.(Math.max(0, Math.min(0.9, bytesSent / totalBytes * 0.9)));
        },
      });
      if (response.status < 200 || response.status >= 300) {
        let message;
        try { message = JSON.parse(response.body)?.message; } catch {}
        throw new ProfilePhotoApiError(message || "The photo transfer failed. Please try again.");
      }
      onProgress?.(0.9);
      let body;
      try { body = JSON.parse(response.body); } catch { throw new ProfilePhotoApiError("The updated profile photo was not returned."); }
      const result = { id: userId, ...parse(body?.avatar) };
      onProgress?.(1);
      return result;
    },
    async remove(userId) {
      if (!userId) throw new ProfilePhotoApiError("Missing user ID.");
      const response = await call("delete", "/v1/me/avatar-file");
      if (response?.avatar !== null) throw new ProfilePhotoApiError("Photo removal was not confirmed.");
      return { id: userId, avatarUrl: null, avatarMediaId: null, avatarExpiresAt: null };
    },
    async getProfile() {
      const response = await call("get", "/v1/me/avatar-file");
      return response?.avatar === null ? { avatarUrl: null, avatarMediaId: null, avatarExpiresAt: null } : parse(response?.avatar);
    },
  };
}

export const profilePhotoApi = createMongoProfilePhotoApi({
  request: axios,
  getToken: () => Auth.currentUser?.getIdToken(),
  baseUrl: API_BASE_URL,
});
