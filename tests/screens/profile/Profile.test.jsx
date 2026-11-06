import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Provider, createStore } from "jotai";
import axios from "axios";
import { signOut } from "firebase/auth";
import { Auth } from "../../../FirebaseConfig";
import Profile from "../../../app/screens/Profile";
import { userState } from "../../../app/state/atoms/UserState";
import { selectProfilePhoto } from "../../../app/profilePhoto/selectPhoto";
import { profilePhotoApi } from "../../../app/profilePhoto/api";

jest.mock("firebase/auth", () => ({ signOut: jest.fn() }));
jest.mock("../../../FirebaseConfig", () => ({ Auth: { currentUser: null } }));
jest.mock("axios", () => ({ get: jest.fn(), patch: jest.fn(), delete: jest.fn() }));
jest.mock("../../../constant", () => ({ IP: "localhost" }));
jest.mock("../../../app/profilePhoto/selectPhoto", () => ({ selectProfilePhoto: jest.fn() }));
jest.mock("@expo/vector-icons/Feather", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});

beforeEach(() => {
  jest.resetAllMocks();
  Auth.currentUser = null;
  jest.spyOn(console, "error").mockImplementation(() => {});
  signOut.mockResolvedValue(undefined);
  jest.spyOn(console, "log").mockImplementation(() => {});
  axios.get.mockResolvedValue({ data: [{ _id: "i-1", text: "Hiking" }, { _id: "i-2", text: "Movies" }] });
  selectProfilePhoto.mockResolvedValue(null);
});
afterEach(() => jest.restoreAllMocks());

const initialUser = {
  _id: "me-1",
  fullname: "Casey User",
  bio: "Always up for an adventure.",
  interests: [{ _id: "i-1", text: "Hiking" }],
};
const renderProfile = async (user = initialUser) => {
  const store = createStore();
  store.set(userState, user);
  const view = await render(
    <Provider store={store}>
      <Profile route={{ params: { platform: "ios" } }} />
    </Provider>
  );
  return { ...view, store };
};

describe("Profile", () => {
  it("previews the actual processed image and clears it on cancel", async () => {
    selectProfilePhoto.mockResolvedValue({ uri: "file://cropped.jpg", width: 512, height: 512 });
    await renderProfile();
    await fireEvent.press(screen.getByLabelText("Edit profile photo"));
    await fireEvent.press(screen.getByText("Choose from gallery"));
    await waitFor(() => expect(screen.getByLabelText("Cropped photo preview")).toHaveProp("source", { uri: "file://cropped.jpg" }));
    await fireEvent.press(screen.getByText("Cancel"));
    expect(screen.queryByLabelText("Cropped photo preview")).toBeNull();
  });

  it("keeps the existing avatar when upload is unavailable", async () => {
    selectProfilePhoto.mockResolvedValue({ uri: "file://cropped.jpg", width: 512, height: 512 });
    const { store } = await renderProfile({ ...initialUser, avatarUrl: "https://example.com/old.jpg" });
    await fireEvent.press(screen.getByLabelText("Edit profile photo"));
    await fireEvent.press(screen.getByText("Take photo"));
    await waitFor(() => expect(screen.getByText("Save photo")).toBeOnTheScreen());
    await fireEvent.press(screen.getByText("Save photo"));
    expect(screen.getByText(/Photo upload is unavailable/)).toBeOnTheScreen();
    expect(store.get(userState).avatarUrl).toBe("https://example.com/old.jpg");
  });

  it("shows a picker error without replacing profile data", async () => {
    selectProfilePhoto.mockRejectedValue(new Error("Photo access was denied."));
    const { store } = await renderProfile();
    await fireEvent.press(screen.getByLabelText("Edit profile photo"));
    await fireEvent.press(screen.getByText("Choose from gallery"));
    await waitFor(() => expect(screen.getByText("Photo access was denied.")).toBeOnTheScreen());
    expect(store.get(userState)).toEqual(initialUser);
  });

  it("shows preparation progress and blocks repeat selection", async () => {
    let finish;
    selectProfilePhoto.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    await renderProfile();
    await fireEvent.press(screen.getByLabelText("Edit profile photo"));
    fireEvent.press(screen.getByText("Choose from gallery"));
    await waitFor(() => expect(screen.getByLabelText("Preparing photo")).toBeOnTheScreen());
    expect(screen.getByText("Take photo").parent).toBeDisabled();
    finish(null);
    await waitFor(() => expect(screen.queryByLabelText("Preparing photo")).toBeNull());
  });

  it("shows upload progress and updates the avatar only after confirmation", async () => {
    selectProfilePhoto.mockResolvedValue({ uri: "file://cropped.jpg", width: 512, height: 512, mimeType: "image/jpeg" });
    let confirmUpload;
    const pendingUpload = new Promise((resolve) => { confirmUpload = resolve; });
    jest.spyOn(profilePhotoApi, "save").mockImplementation((_id, _photo, onProgress) => {
      onProgress(0.5);
      return pendingUpload;
    });
    const { store } = await renderProfile({ ...initialUser, avatarUrl: "https://example.com/old.jpg" });
    await fireEvent.press(screen.getByLabelText("Edit profile photo"));
    await fireEvent.press(screen.getByText("Choose from gallery"));
    await waitFor(() => expect(screen.getByText("Save photo")).toBeOnTheScreen());
    fireEvent.press(screen.getByText("Save photo"));
    await waitFor(() => expect(screen.getByText("Uploading photo: 50%")).toBeOnTheScreen());
    expect(store.get(userState).avatarUrl).toBe("https://example.com/old.jpg");
    confirmUpload({ id: "me-1", avatarUrl: "https://example.com/new.jpg" });
    await waitFor(() => expect(store.get(userState).avatarUrl).toBe("https://example.com/new.jpg"));
    expect(screen.queryByText("Save photo")).toBeNull();
  });
  it("shows the user's profile and signs out", async () => {
    const { store } = await renderProfile();
    expect(screen.getByText("Casey User")).toBeOnTheScreen();
    expect(screen.getByText("Always up for an adventure.")).toBeOnTheScreen();
    expect(screen.getByText("Hiking")).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Logout"));
    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(store.get(userState)).toBeNull();
  });

  it("validates the name and can cancel profile editing", async () => {
    await renderProfile();
    await fireEvent.press(screen.getByText("edit"));
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your full name"), "");
    await fireEvent.press(screen.getByText("Update"));

    expect(screen.getByText("*fullname is required")).toBeOnTheScreen();
    expect(axios.patch).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Cancel"));
    expect(screen.getByText("Casey User")).toBeOnTheScreen();
  });

  it("deletes the account from the backend and Firebase", async () => {
    const deleteUser = jest.fn().mockResolvedValue(undefined);
    Auth.currentUser = { uid: "firebase-1", delete: deleteUser };
    axios.delete.mockResolvedValue({});
    const { store } = await renderProfile();
    await fireEvent.press(screen.getByText("edit"));
    await fireEvent.press(screen.getByText("Delete Account"));

    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith("http://localhost:5051/deleteUser/me-1/firebase-1")
    );
    expect(deleteUser).toHaveBeenCalledTimes(1);
    expect(store.get(userState)).toBeNull();
  });

  it("saves profile edits and selected interests", async () => {
    const updatedUser = {
      ...initialUser,
      fullname: "Casey New",
      bio: "Trail runner",
      interests: [{ _id: "i-2", text: "Movies" }],
    };
    axios.patch.mockResolvedValue({ data: updatedUser });
    const { store } = await renderProfile();
    await fireEvent.press(screen.getByText("edit"));
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your full name"), "Casey New");
    await fireEvent.changeText(screen.getByPlaceholderText("Describe your personality in short"), "Trail runner");
    await fireEvent.press(screen.getByText("Hiking"));
    await fireEvent.press(screen.getByText("Movies"));
    await fireEvent.press(screen.getByText("Update"));

    await waitFor(() =>
      expect(axios.patch).toHaveBeenCalledWith("http://localhost:5051/user/me-1", {
        fullname: "Casey New",
        bio: "Trail runner",
        interests: ["i-2"],
      })
    );
    expect(store.get(userState)).toEqual(updatedUser);
    expect(screen.getByText("Casey New")).toBeOnTheScreen();
  });
});


describe("Profile failure recovery", () => {
  it("keeps the current session when sign out fails", async () => {
    const error = new Error("Sign out unavailable");
    signOut.mockRejectedValueOnce(error);
    const { store } = await renderProfile();
    await fireEvent.press(screen.getByText("Logout"));

    await waitFor(() => expect(console.error).toHaveBeenCalledWith(error));
    expect(store.get(userState)).toEqual(initialUser);
    expect(screen.getByText("Casey User")).toBeOnTheScreen();
  });

  it("retains unsaved edits on update failure and saves them on retry", async () => {
    const error = new Error("Update unavailable");
    const updatedUser = { ...initialUser, fullname: "Casey New" };
    axios.patch.mockRejectedValueOnce(error).mockResolvedValueOnce({ data: updatedUser });
    const { store } = await renderProfile();
    await fireEvent.press(screen.getByText("edit"));
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your full name"), "Casey New");
    await fireEvent.press(screen.getByText("Update"));

    await waitFor(() => expect(console.error).toHaveBeenCalledWith(error, "Error updating user data"));
    expect(store.get(userState)).toEqual(initialUser);
    expect(screen.getByPlaceholderText("Enter your full name")).toHaveDisplayValue("Casey New");
    await fireEvent.press(screen.getByText("Update"));

    await waitFor(() => expect(screen.getByText("Casey New")).toBeOnTheScreen());
    expect(axios.patch).toHaveBeenCalledTimes(2);
    expect(axios.patch).toHaveBeenLastCalledWith("http://localhost:5051/user/me-1", {
      fullname: "Casey New", bio: initialUser.bio, interests: ["i-1"],
    });
    expect(store.get(userState)).toEqual(updatedUser);
    expect(screen.queryByPlaceholderText("Enter your full name")).toBeNull();
  });

  it("preserves the account and skips Firebase deletion when backend deletion fails", async () => {
    const error = new Error("Delete unavailable");
    const deleteUser = jest.fn();
    Auth.currentUser = { uid: "firebase-1", delete: deleteUser };
    axios.delete.mockRejectedValueOnce(error);
    const { store } = await renderProfile();
    await fireEvent.press(screen.getByText("edit"));
    await fireEvent.press(screen.getByText("Delete Account"));

    await waitFor(() => expect(console.error).toHaveBeenCalledWith("Error deleting user account:", error));
    expect(deleteUser).not.toHaveBeenCalled();
    expect(store.get(userState)).toEqual(initialUser);
    expect(screen.getByPlaceholderText("Enter your full name")).toHaveDisplayValue(initialUser.fullname);
  });
});
