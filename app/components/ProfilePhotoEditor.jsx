import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Give each photo action the same touch target and disabled behavior.
function PhotoAction({ label, onPress, disabled, variant }) {
  const actionStyle = [styles.photoAction, variant && styles[`${variant}Action`]];
  const textStyle = variant === "primary" ? styles.primaryText
    : variant === "destructive" ? styles.destructiveText : styles.defaultText;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={actionStyle}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

// Show photo choices and progress. The hook handles the actual photo work.
export default function ProfilePhotoEditor({ avatarUrl, editor }) {
  const {
    photoEditorOpen,
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
  } = editor;
  const hasPhoto = Boolean(avatarUrl);
  const chooseFromLibrary = () => choosePhoto("library");
  const progressLabel = photoProgress >= 0.9
    ? "Finishing photo..."
    : `Uploading photo: ${Math.round(photoProgress * 100)}%`;

  return (
    <Modal
      visible={photoEditorOpen}
      animationType="slide"
      transparent
      onRequestClose={closePhotoEditor}
    >
      <SafeAreaView style={styles.photoBackdrop}>
        <View style={styles.photoSheet}>
          <Text style={styles.photoTitle}>
            {hasPhoto ? "Replace profile photo" : "Profile photo"}
          </Text>
          <Text style={styles.photoHint}>
            {photoDraft
              ? "Preview your crop before saving."
              : hasPhoto
                ? "Choose a new photo or remove this one."
                : "Choose a photo to show on your profile."}
          </Text>
          {photoDraft && (
            <Image
              accessibilityLabel="Cropped photo preview"
              source={{ uri: photoDraft.uri }}
              style={styles.photoPreview}
            />
          )}
          {photoBusy && (
            <ActivityIndicator
              accessibilityLabel={photoRemoving
                ? "Removing photo"
                : photoProgress === null ? "Preparing photo" : "Uploading photo"}
              color="#67AB0F"
            />
          )}
          {photoProgress !== null && photoBusy && (
            <Text
              style={styles.photoStatus}
              accessibilityLiveRegion="polite"
              accessibilityLabel="Photo upload progress"
            >
              {progressLabel}
            </Text>
          )}
          <PhotoAction
            label={photoDraft
              ? "Choose another photo"
              : hasPhoto ? "Upload new photo" : "Choose from gallery"}
            onPress={chooseFromLibrary}
            disabled={photoBusy}
            variant={photoDraft ? undefined : "primary"}
          />
          {photoDraft && (
            <PhotoAction
              label={photoCanRetry ? "Retry upload" : hasPhoto ? "Replace photo" : "Save photo"}
              onPress={savePhoto}
              disabled={photoBusy}
              variant="primary"
            />
          )}
          {hasPhoto && !photoDraft && (
            removeConfirm ? (
              <>
                <Text style={styles.removePrompt}>Remove your current profile photo?</Text>
                <PhotoAction
                  label="Confirm removal"
                  onPress={removePhoto}
                  disabled={photoBusy}
                  variant="destructive"
                />
                <PhotoAction
                  label="Keep photo"
                  onPress={() => setRemoveConfirm(false)}
                  disabled={photoBusy}
                />
              </>
            ) : (
              <PhotoAction
                label="Delete photo"
                onPress={() => setRemoveConfirm(true)}
                disabled={photoBusy}
                variant="destructive"
              />
            )
          )}
          {!!photoError && (
            <Text accessibilityRole="alert" style={styles.photoError}>{photoError}</Text>
          )}
          <PhotoAction
            label="Cancel"
            onPress={closePhotoEditor}
            disabled={photoBusy}
            variant="cancel"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  photoBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#0006" },
  photoSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 25, paddingBottom: 20, alignItems: "center", gap: 10 },
  photoTitle: { color: "#172115", fontSize: 21, fontWeight: "700", textAlign: "center" },
  photoHint: { color: "#667263", fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 8 },
  photoPreview: { width: 196, height: 196, borderRadius: 98, marginBottom: 8 },
  photoStatus: { color: "#47790B", fontSize: 14, fontWeight: "500" },
  photoAction: { minHeight: 50, width: "100%", borderRadius: 25, backgroundColor: "#EAF5E3", justifyContent: "center", alignItems: "center" },
  primaryAction: { backgroundColor: "#67AB0F" },
  cancelAction: { backgroundColor: "#F2F5EF" },
  destructiveAction: { backgroundColor: "#FDEEEF" },
  defaultText: { color: "#2F432D", fontSize: 15, fontWeight: "600" },
  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  destructiveText: { color: "#A0242A", fontSize: 15, fontWeight: "600" },
  removePrompt: { color: "#4B5A48", fontSize: 14, textAlign: "center" },
  photoError: { color: "#AB0F12", fontSize: 14, textAlign: "center" },
});
