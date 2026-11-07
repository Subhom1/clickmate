import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const PICKER_OPTIONS = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1,
};

export class PhotoSelectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "PhotoSelectionError";
  }
}

/**
 * Opens the platform crop editor, then exports the edited pixels as a 512px JPEG.
 * A non-square native result is center-cropped before resize so faces are not stretched.
 */
export async function selectProfilePhoto(source) {
  if (source !== "library" && source !== "camera") {
    throw new PhotoSelectionError("Choose the gallery or camera.");
  }

  const permission = source === "camera"
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted && permission.accessPrivileges !== "limited") {
    throw new PhotoSelectionError(
      source === "camera" ? "Camera access was denied." : "Photo access was denied."
    );
  }

  const result = source === "camera"
    ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
    : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset?.uri || !Number.isFinite(asset.width) || !Number.isFinite(asset.height) ||
      asset.width <= 0 || asset.height <= 0 || (asset.type && asset.type !== "image")) {
    throw new PhotoSelectionError("The selected image could not be opened.");
  }

  const side = Math.min(asset.width, asset.height);
  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width !== asset.height) {
    context.crop({
      originX: Math.floor((asset.width - side) / 2),
      originY: Math.floor((asset.height - side) / 2),
      width: side,
      height: side,
    });
  }
  context.resize({ width: 512, height: 512 });
  const image = await context.renderAsync();
  const output = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  if (!output?.uri || output.width !== 512 || output.height !== 512) {
    throw new PhotoSelectionError("The cropped image could not be saved.");
  }
  return { uri: output.uri, width: 512, height: 512, mimeType: "image/jpeg" };
}
