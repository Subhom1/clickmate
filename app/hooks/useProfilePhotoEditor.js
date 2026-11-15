import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { selectProfilePhoto } from "../profilePhoto/selectPhoto";
import { profilePhotoApi, ProfilePhotoApiUnavailableError } from "../profilePhoto/api";

// Own the photo draft, upload state, and avatar refresh in one place.
export function useProfilePhotoEditor(userData, setUserData) {
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [photoDraft, setPhotoDraft] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoProgress, setPhotoProgress] = useState(null);
  const [photoCanRetry, setPhotoCanRetry] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [photoRemoving, setPhotoRemoving] = useState(false);

  const resetEditor = () => {
    setPhotoDraft(null);
    setPhotoError("");
    setPhotoProgress(null);
    setPhotoCanRetry(false);
    setRemoveConfirm(false);
    setPhotoEditorOpen(false);
  };

  const choosePhoto = async (source) => {
    if (photoBusy) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const selected = await selectProfilePhoto(source);
      if (selected) {
        setPhotoDraft(selected);
        setRemoveConfirm(false);
        setPhotoCanRetry(false);
        setPhotoProgress(null);
      }
    } catch (error) {
      setPhotoError(error?.message || "The photo could not be prepared.");
    } finally {
      setPhotoBusy(false);
    }
  };
  const closePhotoEditor = () => {
    if (!photoBusy) resetEditor();
  };
  const savePhoto = async () => {
    if (!photoDraft || !userData?._id || photoBusy) return;
    setPhotoBusy(true);
    setPhotoError("");
    setPhotoProgress(0);
    try {
      const result = await profilePhotoApi.save(userData._id, photoDraft, setPhotoProgress);
      if (result?.id !== userData._id || !result.avatarUrl) {
        throw new Error("The updated profile photo was not returned.");
      }
      setUserData((current) => current?._id === result.id ? {
        ...current,
        avatarUrl: result.avatarUrl,
        avatarMediaId: result.avatarMediaId,
        avatarExpiresAt: result.avatarExpiresAt,
      } : current);
      resetEditor();
    } catch (error) {
      setPhotoError(error?.message || "The photo could not be saved.");
      setPhotoProgress(null);
      setPhotoCanRetry(!(error instanceof ProfilePhotoApiUnavailableError));
    } finally {
      setPhotoBusy(false);
    }
  };
  const removePhoto = async () => {
    if (!removeConfirm || !userData?._id || !userData?.avatarUrl || photoBusy) return;
    setPhotoBusy(true);
    setPhotoRemoving(true);
    setPhotoError("");
    try {
      const result = await profilePhotoApi.remove(userData._id);
      if (result?.id !== userData._id || result.avatarUrl !== null) {
        throw new Error("Photo removal was not confirmed.");
      }
      setUserData((current) => current?._id === result.id ? {
        ...current,
        avatarUrl: null,
        avatarMediaId: null,
        avatarExpiresAt: null,
      } : current);
      resetEditor();
    } catch (error) {
      setPhotoError(error?.message || "The photo could not be removed.");
    } finally {
      setPhotoBusy(false);
      setPhotoRemoving(false);
    }
  };
  useEffect(() => {
    if (!userData?._id || !userData?.avatarMediaId || !userData?.avatarExpiresAt) {
      return;
    }
    let active = true;
    let retryTimer;
    const refresh = async () => {
      try {
        const avatar = await profilePhotoApi.getProfile();
        if (active) {
          setUserData((current) => current?._id === userData._id
            ? { ...current, ...avatar }
            : current);
        }
      } catch {
        if (active) retryTimer = setTimeout(refresh, 30000);
      }
    };
    // Refresh shortly before the temporary avatar URL expires.
    const delay = Math.max(0, Date.parse(userData.avatarExpiresAt) - Date.now() - 30000);
    const expiryTimer = setTimeout(refresh, Number.isFinite(delay) ? delay : 0);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && Date.parse(userData.avatarExpiresAt) - Date.now() < 30000) {
        refresh();
      }
    });
    return () => {
      active = false;
      clearTimeout(expiryTimer);
      clearTimeout(retryTimer);
      subscription.remove();
    };
  }, [userData?._id, userData?.avatarMediaId, userData?.avatarExpiresAt]);
  return {
    photoEditorOpen,
    setPhotoEditorOpen,
    photoDraft,
    photoBusy,
    photoError,
    photoProgress,
    photoCanRetry,
    removeConfirm,
    setRemoveConfirm,
    photoRemoving,
    choosePhoto,
    closePhotoEditor,
    savePhoto,
    removePhoto,
  };
}
