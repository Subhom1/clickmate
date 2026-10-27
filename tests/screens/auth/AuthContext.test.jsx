import React from "react";
import { act, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { useAtomValue } from "jotai";
import axios from "axios";
import { AuthContext, AuthProvider } from "../../../AuthContext";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { userState } from "../../../app/state/atoms/UserState";

const mockAuthListener = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock("../../../FirebaseConfig", () => ({
  Auth: {
    onAuthStateChanged: (listener) => {
      mockAuthListener(listener);
      return mockUnsubscribe;
    },
  },
}));
jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn() } }));

function AuthProbe() {
  const { user, platform } = React.useContext(AuthContext);
  const userData = useAtomValue(userState);
  return (
    <View>
      <Text>{user?.email ?? "signed out"}</Text>
      <Text>{platform}</Text>
      <Text>{userData?.name ?? "no profile"}</Text>
    </View>
  );
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe("AuthProvider", () => {
  it("exposes the signed-out state and platform", async () => {
    await renderWithProviders(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(screen.getByText("signed out")).toBeOnTheScreen();
    expect(screen.getByText("ios")).toBeOnTheScreen();
    expect(screen.getByText("no profile")).toBeOnTheScreen();
  });

  it("does not request a profile for a signed-out auth callback", async () => {
    await renderWithProviders(<AuthProvider><AuthProbe /></AuthProvider>);
    await act(async () => { mockAuthListener.mock.calls[0][0](null); });

    expect(screen.getByText("signed out")).toBeOnTheScreen();
    expect(screen.getByText("no profile")).toBeOnTheScreen();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("preserves the authenticated session when the profile request fails", async () => {
    const error = new Error("Profile service unavailable");
    axios.get.mockRejectedValue(error);
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await renderWithProviders(<AuthProvider><AuthProbe /></AuthProvider>);
      await act(async () => {
        mockAuthListener.mock.calls[0][0]({ uid: "u-1", email: "casey@example.com" });
      });

      expect(screen.getByText("casey@example.com")).toBeOnTheScreen();
      expect(screen.getByText("no profile")).toBeOnTheScreen();
      expect(log).toHaveBeenCalledWith(error, "Error message: mongodb user details");
    } finally {
      log.mockRestore();
    }
  });

  it("loads the profile after authentication and unsubscribes on unmount", async () => {
    axios.get.mockResolvedValue({ data: { name: "Casey User" } });
    const view = await renderWithProviders(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );
    const onAuthChange = mockAuthListener.mock.calls[0][0];

    await act(async () => {
      onAuthChange({ uid: "user-1", email: "casey@example.com" });
    });

    expect(screen.getByText("casey@example.com")).toBeOnTheScreen();
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/user\/casey@example\.com$/));
    expect(screen.getByText("Casey User")).toBeOnTheScreen();

    await act(async () => {
      view.unmount();
    });
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
