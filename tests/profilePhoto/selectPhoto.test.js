import * as ImagePicker from "expo-image-picker";
import { ImageManipulator } from "expo-image-manipulator";
import { selectProfilePhoto, PhotoSelectionError } from "../../app/profilePhoto/selectPhoto";

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("expo-image-manipulator", () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: "jpeg" },
}));

const crop = jest.fn();
const resize = jest.fn();
const saveAsync = jest.fn();
const renderAsync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  crop.mockReturnValue({ resize });
  resize.mockReturnValue({ renderAsync });
  renderAsync.mockResolvedValue({ saveAsync });
  saveAsync.mockResolvedValue({ uri: "file://avatar.jpg", width: 512, height: 512 });
  ImageManipulator.manipulate.mockReturnValue({ crop, resize, renderAsync });
  ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
  ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
  ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: "file://photo.jpg", width: 1024, height: 1024, type: "image" }] });
  ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: "file://camera.jpg", width: 1200, height: 900, type: "image" }] });
});

it("exports an edited square library image as a 512px JPEG", async () => {
  await expect(selectProfilePhoto("library")).resolves.toEqual({ uri: "file://avatar.jpg", width: 512, height: 512, mimeType: "image/jpeg" });
  expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ allowsEditing: true, aspect: [1, 1], mediaTypes: ["images"] }));
  expect(crop).not.toHaveBeenCalled();
  expect(resize).toHaveBeenCalledWith({ width: 512, height: 512 });
  expect(saveAsync).toHaveBeenCalledWith({ format: "jpeg", compress: 0.8 });
});

it("crops a non-square native camera result before resizing", async () => {
  await selectProfilePhoto("camera");
  expect(crop).toHaveBeenCalledWith({ originX: 150, originY: 0, width: 900, height: 900 });
  expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
});

it.each(["library", "camera"])("handles %s denial without opening the picker", async (source) => {
  const permission = source === "library" ? ImagePicker.requestMediaLibraryPermissionsAsync : ImagePicker.requestCameraPermissionsAsync;
  permission.mockResolvedValue({ granted: false });
  await expect(selectProfilePhoto(source)).rejects.toBeInstanceOf(PhotoSelectionError);
  expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
});

it("accepts limited photo access and returns null on picker cancellation", async () => {
  ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false, accessPrivileges: "limited" });
  ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
  await expect(selectProfilePhoto("library")).resolves.toBeNull();
  expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
});

it("rejects invalid assets and malformed exported files", async () => {
  ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: "file://bad.jpg", width: 0, height: 20 }] });
  await expect(selectProfilePhoto("library")).rejects.toBeInstanceOf(PhotoSelectionError);
  saveAsync.mockResolvedValue({ uri: "file://bad.jpg", width: 512, height: 400 });
  await expect(selectProfilePhoto("library")).rejects.toBeInstanceOf(PhotoSelectionError);
  await expect(selectProfilePhoto("invalid")).rejects.toBeInstanceOf(PhotoSelectionError);
});
