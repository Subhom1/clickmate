import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react-native";
import { Provider } from "jotai";
import { Keyboard } from "react-native";
import { RootLayout } from "../../_layout";

jest.mock("expo-router/react-navigation", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    NavigationContainer: ({ children }) => React.createElement(View, null, children),
  };
});
jest.mock("expo-router/native-stack", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => React.createElement(View, null, children),
      Screen: ({ name, component, initialParams }) => {
        if (name === "Tab") {
          const Tabs = component;
          return React.createElement(Tabs, { route: { params: initialParams } });
        }
        return React.createElement(Text, null, `${name}:${initialParams?.platform}`);
      },
    }),
  };
});
jest.mock("expo-router/js-tabs", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children, screenOptions }) =>
        React.createElement(View, { testID: "tab-bar", style: screenOptions.tabBarStyle }, children),
      Screen: ({ name, initialParams }) =>
        React.createElement(Text, null, `${name}:${initialParams?.platform}`),
    }),
  };
});
jest.mock("../../app/screens/Login", () => ({ __esModule: true, default: () => null }));
jest.mock("../../app/screens/SignUp", () => ({ __esModule: true, default: () => null }));
jest.mock("../../app/screens/Home", () => ({ __esModule: true, default: () => null }));
jest.mock("../../app/screens/Explore", () => ({ __esModule: true, default: () => null }));
jest.mock("../../app/screens/People", () => ({ __esModule: true, default: () => null }));
jest.mock("../../app/screens/Profile", () => ({ __esModule: true, default: () => null }));
jest.mock("../../app/screens/Result", () => ({ __esModule: true, default: () => null }));
jest.mock("../../app/screens/ChatScreen/ChatScreen", () => ({ __esModule: true, default: () => null }));
jest.mock("../../app/screens/VisitorProfile", () => ({ __esModule: true, default: () => null }));
jest.mock("../../app/screens/ExploreSearch", () => ({ __esModule: true, default: () => null }));
jest.mock("../../FirebaseConfig", () => ({ Auth: {} }));
jest.mock("firebase/auth", () => ({ signInWithEmailAndPassword: jest.fn(), signOut: jest.fn() }));
jest.mock("@expo/vector-icons/Entypo", () => () => null);
jest.mock("@expo/vector-icons/Octicons", () => () => null);

const renderLayout = async (user, platform = "ios") => {
  await render(
    <Provider>
      <RootLayout user={user} platform={platform} />
    </Provider>
  );
};

describe("RootLayout", () => {
  it("shows the authentication screens when the user is signed out", async () => {
    await renderLayout(null, "android");
    await waitFor(() => expect(screen.getByText("Login:android")).toBeOnTheScreen());
    expect(screen.getByText("SignUp:android")).toBeOnTheScreen();
  });

  it("shows the app tabs and carries the platform through navigation", async () => {
    const user = { stsTokenManager: { expirationTime: Date.now() + 60_000 } };
    await renderLayout(user, "ios");

    await waitFor(() => expect(screen.getByText("Home:ios")).toBeOnTheScreen());
    expect(screen.getByText("Explore:ios")).toBeOnTheScreen();
    expect(screen.getByText("People:ios")).toBeOnTheScreen();
    expect(screen.getByText("Profile:ios")).toBeOnTheScreen();
    expect(screen.getByText("Result:ios")).toBeOnTheScreen();
    expect(screen.getByText("ChatScreen:ios")).toBeOnTheScreen();
    expect(screen.getByText("VisitorProfile:ios")).toBeOnTheScreen();
    expect(screen.getByText("ExploreSearch:ios")).toBeOnTheScreen();
  });
});


describe("RootLayout session and keyboard transitions", () => {
  afterEach(() => jest.restoreAllMocks());

  it("rejects a token expiring exactly at the current time", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1000);
    await renderLayout({ stsTokenManager: { expirationTime: 1000 } });
    expect(screen.getByText("Login:ios")).toBeOnTheScreen();
    expect(screen.queryByText("Home:ios")).toBeNull();
  });

  it("rejects a user without token metadata", async () => {
    await renderLayout({ uid: "missing-token" });
    expect(screen.getByText("Login:ios")).toBeOnTheScreen();
    expect(screen.queryByText("Home:ios")).toBeNull();
  });

  it("removes authenticated routes when the session signs out", async () => {
    const user = { stsTokenManager: { expirationTime: Date.now() + 60_000 } };
    const view = await render(<Provider><RootLayout user={user} platform="android" /></Provider>);
    expect(screen.getByText("ChatScreen:android")).toBeOnTheScreen();
    await view.rerender(<Provider><RootLayout user={null} platform="android" /></Provider>);
    expect(screen.getByText("Login:android")).toBeOnTheScreen();
    expect(screen.queryByText("ChatScreen:android")).toBeNull();
    expect(screen.queryByTestId("tab-bar")).toBeNull();
  });

  it.each([
    ["android", 75, -280],
    ["ios", 90, 0],
  ])("handles the %s keyboard and releases listeners on exit", async (platform, height, bottom) => {
    const listeners = {};
    const removals = [];
    jest.spyOn(Keyboard, "addListener").mockImplementation((event, callback) => {
      listeners[event] = callback;
      const remove = jest.fn();
      removals.push(remove);
      return { remove };
    });
    const user = { stsTokenManager: { expirationTime: Date.now() + 60_000 } };
    const view = await render(<Provider><RootLayout user={user} platform={platform} /></Provider>);
    expect(screen.getByTestId("tab-bar")).toHaveStyle({ height, bottom: 0 });
    await act(() => listeners.keyboardDidShow({ endCoordinates: { height: 280 } }));
    expect(screen.getByTestId("tab-bar")).toHaveStyle({ bottom });
    await act(() => listeners.keyboardDidHide());
    expect(screen.getByTestId("tab-bar")).toHaveStyle({ bottom: 0 });
    await view.unmount();
    expect(removals).toHaveLength(2);
    removals.forEach(remove => expect(remove).toHaveBeenCalledTimes(1));
  });
});
