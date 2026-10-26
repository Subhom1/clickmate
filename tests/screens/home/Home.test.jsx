import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert, Text } from "react-native";
import { Provider, createStore, useAtomValue } from "jotai";
import io from "socket.io-client";
import Home from "../../../app/screens/Home";
import { userState } from "../../../app/state/atoms/UserState";
import { matchState } from "../../../app/state/atoms/MatchState";
import { createSocketMock } from "../../mocks/socket";

const mockNavigation = { navigate: jest.fn() };
let mockSocket;
jest.mock("expo-router/react-navigation", () => ({ useNavigation: () => mockNavigation }));
jest.mock("socket.io-client", () => jest.fn(() => mockSocket));
jest.mock("../../../constant", () => ({ IP: "localhost" }));
jest.mock("../../../app/components/ToggleSwitch", () => () => null);
jest.mock("@expo/vector-icons/FontAwesome5", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});
jest.mock("@expo/vector-icons/Feather", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});

function MatchProbe() {
  const match = useAtomValue(matchState);
  return <Text>{match?.user?.fullname ?? "no match"}</Text>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockSocket = createSocketMock();
  mockSocket.connected = true;
});
afterEach(() => jest.restoreAllMocks());

const renderHome = async ({ user = { _id: "me-1" }, connected = true } = {}) => {
  mockSocket.connected = connected;
  const store = createStore();
  store.set(userState, user);
  const view = await render(
    <Provider store={store}>
      <Home route={{ params: { platform: "ios" } }} />
      <MatchProbe />
    </Provider>
  );
  return { ...view, store };
};

describe("Home search", () => {
  it("requires a query and a loaded user before searching", async () => {
    await renderHome({ user: null });
    await fireEvent.press(screen.getByText("Search"));
    expect(Alert.alert).toHaveBeenCalledWith("Search required", "Please enter a search query");

    await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
    await fireEvent.press(screen.getByText("Search"));
    expect(Alert.alert).toHaveBeenCalledWith("Please wait", "Your profile is still loading");
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it("submits a trimmed query and lets the user cancel", async () => {
    await renderHome();
    await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "  coffee meetup  ");
    await fireEvent.press(screen.getByText("Search"));

    expect(mockSocket.emit).toHaveBeenCalledWith("submit_keyword", {
      userId: "me-1",
      query: "coffee meetup",
    });
    expect(screen.getByText("Searching . . .")).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Cancel"));
    expect(mockSocket.emit).toHaveBeenCalledWith("cancel_search", { userId: "me-1" });
    expect(screen.getByText("Search")).toBeOnTheScreen();
  });

  it("reports unavailable socket connections", async () => {
    await renderHome({ connected: false });
    await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
    await fireEvent.press(screen.getByText("Search"));

    expect(Alert.alert).toHaveBeenCalledWith("Connection unavailable", "Please try again in a moment");
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it("opens the result screen when a match arrives", async () => {
    const { store } = await renderHome();
    await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
    await fireEvent.press(screen.getByText("Search"));
    const match = { user: { _id: "friend-1", fullname: "Alex Friend" } };
    await act(async () => mockSocket.serverEmit("search_update", { matches: match }));

    expect(store.get(matchState)).toEqual(match);
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Result");
  });

  it("shows no-result and server error feedback, then cleans up the socket", async () => {
    const view = await renderHome();
    await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
    await fireEvent.press(screen.getByText("Search"));
    await act(async () => mockSocket.serverEmit("search_update", { matches: null }));
    expect(screen.getByText(/No Users found/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Search"));
    await act(async () => mockSocket.serverEmit("error", { message: "try later" }));
    expect(Alert.alert).toHaveBeenCalledWith("Error", "try later");
    expect(screen.getByText("Search")).toBeOnTheScreen();

    await act(async () => view.unmount());
    expect(mockSocket.off).toHaveBeenCalledWith("search_update");
    expect(mockSocket.off).toHaveBeenCalledWith("error");
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});
