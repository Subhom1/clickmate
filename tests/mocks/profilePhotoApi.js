/** A deterministic frontend-only mock. It does not call a backend. */
export function createMockProfilePhotoApi(initialAvatarUrl = null) {
  let avatarUrl = initialAvatarUrl;
  return {
    async save(userId, photo, onProgress) {
      if (!userId || !photo?.uri || photo.width !== 512 || photo.height !== 512) {
        throw new Error("Invalid profile photo upload request.");
      }
      onProgress?.(0.5);
      avatarUrl = "https://mock.invalid/avatar.jpg";
      onProgress?.(1);
      return { id: userId, avatarUrl };
    },
    async remove(userId) {
      if (!userId) throw new Error("Missing user ID.");
      avatarUrl = null;
      return { id: userId, avatarUrl };
    },
  };
}
