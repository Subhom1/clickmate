/**
 * @typedef {{uri: string, width: number, height: number, mimeType: 'image/jpeg'}} ProcessedProfilePhoto
 * @typedef {{id: string, avatarUrl: string | null}} ProfilePhotoResult
 * @typedef {{save: (userId: string, photo: ProcessedProfilePhoto, onProgress?: (fraction: number) => void) => Promise<ProfilePhotoResult>, remove: (userId: string) => Promise<ProfilePhotoResult>}} ProfilePhotoApi
 */

export class ProfilePhotoApiUnavailableError extends Error {
  constructor() {
    super("Photo upload is unavailable until the profile photo API is connected.");
    this.name = "ProfilePhotoApiUnavailableError";
  }
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
