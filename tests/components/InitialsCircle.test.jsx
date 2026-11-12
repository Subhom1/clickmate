import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { PixelRatio } from "react-native";
import { InitialsCircle } from "../../app/components/CreateAvatar";
import { API_BASE_URL } from "../../constant";
import { setProfilePhotoAuthUser } from "../../app/profilePhoto/currentAuth";

jest.mock("../../constant", () => ({ API_BASE_URL: "https://api.clickmate.test" }));
afterEach(() => setProfilePhotoAuthUser(null));

describe("InitialsCircle", () => {
  it("renders the uppercase initials for a person's name", async () => {
    await render(
      <InitialsCircle
        name="Ada Lovelace"
        styles={{ circle: {}, initials: {} }}
      />
    );

    expect(screen.getByText("AL")).toBeOnTheScreen();
  });

  it("renders a single initial for a single name", async () => {
    await render(<InitialsCircle name="ada" styles={{}} />);
    expect(screen.getByText("A")).toBeOnTheScreen();
  });

  it("renders no initials for an empty name", async () => {
    await render(<InitialsCircle name="" styles={{}} />);
    expect(screen.getByText("")).toBeOnTheScreen();
  });

  it("updates the displayed initials when the person changes", async () => {
    const view = await render(<InitialsCircle name="Ada Lovelace" styles={{}} />);
    await view.rerender(<InitialsCircle name="Grace Hopper" styles={{}} />);
    expect(screen.getByText("GH")).toBeOnTheScreen();
    expect(screen.queryByText("AL")).toBeNull();
  });

  it("shows a saved photo instead of initials when a photo URL is present", async () => {
    await render(<InitialsCircle name="Ada Lovelace" photoUri="https://example.com/avatar.jpg" styles={{}} />);
    expect(screen.getByLabelText("Ada Lovelace profile photo")).toHaveProp("source", { uri: "https://example.com/avatar.jpg" });
    expect(screen.queryByText("AL")).toBeNull();
  });

  it("sends an ID token when loading a MongoDB avatar", async () => {
    setProfilePhotoAuthUser({ getIdToken: jest.fn().mockResolvedValue("test-token") });
    const uri = `${API_BASE_URL}/v1/avatar-files/507f1f77bcf86cd799439011`;
    await render(<InitialsCircle name="Ada" photoUri={uri} styles={{}} />);
    await waitFor(() => expect(screen.getByLabelText("Ada profile photo")).toHaveProp("source", {
      uri: `${uri}?size=128`, headers: { Authorization: "Bearer test-token" },
    }));
    setProfilePhotoAuthUser(null);
  });

  it("keeps initials when a protected avatar has no signed-in user", async () => {
    setProfilePhotoAuthUser(null);
    await render(<InitialsCircle name="Ada" photoUri={`${API_BASE_URL}/v1/avatar-files/507f1f77bcf86cd799439011`} styles={{}} />);
    expect(screen.getByText("A")).toBeOnTheScreen();
  });

  it("resolves a friend's MongoDB avatar ID on the shared component", async () => {
    setProfilePhotoAuthUser({ getIdToken: jest.fn().mockResolvedValue("friend-token") });
    await render(<InitialsCircle name="Friend" avatarFileId="507f1f77bcf86cd799439012" styles={{}} />);
    await waitFor(() => expect(screen.getByLabelText("Friend profile photo")).toHaveProp("source", {
      uri: `${API_BASE_URL}/v1/avatar-files/507f1f77bcf86cd799439012?size=128`,
      headers: { Authorization: "Bearer friend-token" },
    }));
  });

  it("upgrades a dense profile avatar after a fast first load", async () => {
    const density = jest.spyOn(PixelRatio, "get").mockReturnValue(3);
    setProfilePhotoAuthUser({ getIdToken: jest.fn().mockResolvedValue("token") });
    const uri = `${API_BASE_URL}/v1/avatar-files/507f1f77bcf86cd799439013`;
    await render(<InitialsCircle name="Ada" photoUri={uri} styles={{ circle: { width: 88, height: 88 } }} />);
    await waitFor(() => expect(screen.getByLabelText("Ada profile photo")).toHaveProp("source", {
      uri: `${uri}?size=256`, headers: { Authorization: "Bearer token" },
    }));
    await fireEvent(screen.getByLabelText("Ada profile photo"), "loadStart");
    await fireEvent(screen.getByLabelText("Ada profile photo"), "load");
    await waitFor(() => expect(screen.getByLabelText("Ada profile photo")).toHaveProp("source", {
      uri: `${uri}?size=512`, headers: { Authorization: "Bearer token" },
    }));
    density.mockRestore();
  });

  it("falls back to initials when the first image request fails", async () => {
    setProfilePhotoAuthUser({ getIdToken: jest.fn().mockResolvedValue("token") });
    await render(<InitialsCircle name="Ada" photoUri={`${API_BASE_URL}/v1/avatar-files/507f1f77bcf86cd799439013`} styles={{}} />);
    const photo = await screen.findByLabelText("Ada profile photo");
    await fireEvent(photo, "error");
    expect(screen.getByText("A")).toBeOnTheScreen();
  });

  it.each([
    [true, "#67AB0F"],
    [false, "#A7B0AD"],
  ])("shows the navigation color when focused is %s", async (focused, backgroundColor) => {
    await render(<InitialsCircle name="Ada" styles={{}} nav focused={focused} />);
    expect(screen.getByText("A").parent).toHaveStyle({ backgroundColor });
  });

  it("preserves the caller's background outside navigation", async () => {
    await render(
      <InitialsCircle name="Ada" styles={{ circle: { backgroundColor: "purple" } }} focused />
    );
    expect(screen.getByText("A").parent).toHaveStyle({ backgroundColor: "purple" });
  });
});
