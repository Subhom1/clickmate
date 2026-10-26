import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { useAtomValue } from "jotai";
import axios from "axios";
import { AuthContext, AuthProvider } from "../../../AuthContext";
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
  jest.clearAllMocks();
});

describe("AuthProvider", () => {
  it("exposes the signed-out state and platform", async () => {
    await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(screen.getByText("signed out")).toBeOnTheScreen();
    expect(screen.getByText("ios")).toBeOnTheScreen();
    expect(screen.getByText("no profile")).toBeOnTheScreen();
  });

  it("loads the profile after authentication and unsubscribes on unmount", async () => {
    axios.get.mockResolvedValue({ data: { name: "Casey User" } });
    const view = await render(
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
