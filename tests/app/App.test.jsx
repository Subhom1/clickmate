import React from "react";
import { render, screen } from "@testing-library/react-native";
import App from "../../App";

jest.mock("../../AuthContext", () => {
  const React = require("react");
  const AuthContext = React.createContext(null);
  const AuthProvider = ({ children }) =>
    React.createElement(
      AuthContext.Provider,
      { value: { user: { uid: "user-1" }, platform: "ios" } },
      children
    );
  return { AuthContext, AuthProvider };
});
jest.mock("../../_layout", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    RootLayout: ({ user, platform }) =>
      React.createElement(Text, null, `${user.uid}:${platform}`),
  };
});
jest.mock("react-native-root-siblings", () => ({
  RootSiblingParent: ({ children }) => children,
}));
jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { GestureHandlerRootView: ({ children }) => React.createElement(View, null, children) };
});
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { SafeAreaProvider: ({ children }) => React.createElement(View, null, children) };
});

describe("App", () => {
  it("provides the authenticated user and platform to the root layout", async () => {
    await render(<App />);
    expect(screen.getByText("user-1:ios")).toBeOnTheScreen();
  });
});
