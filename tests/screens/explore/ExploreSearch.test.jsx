import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Provider, createStore, useAtomValue } from "jotai";
import { Text } from "react-native";
import io from "socket.io-client";
import ExploreSearch from "../../../app/screens/ExploreSearch";
import { userState } from "../../../app/state/atoms/UserState";
import { matchState } from "../../../app/state/atoms/MatchState";
import { createSocketMock } from "../../mocks/socket";

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
let mockSocket;
jest.mock("expo-router/react-navigation", () => ({ useNavigation: () => mockNavigation }));
jest.mock("socket.io-client", () => jest.fn(() => mockSocket));
jest.mock("../../../constant", () => ({ IP: "localhost" }));
jest.mock("@expo/vector-icons/MaterialIcons", () => {
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
  jest.spyOn(console, "log").mockImplementation(() => {});
  mockSocket = createSocketMock();
  mockSocket.connected = true;
});

const route = {
  params: {
    platform: "ios",
    itemTitle: "hikes",
    item: { text: "Coastal walk", imgUrl: "/walk.jpg" },
  },
};

const renderSearch = async ({ user = { _id: "me-1" } } = {}) => {
  const store = createStore();
  store.set(userState, user);
  const view = await render(
    <Provider store={store}>
      <ExploreSearch route={route} />
      <MatchProbe />
    </Provider>
  );
  return { ...view, store };
};

describe("ExploreSearch", () => {
  it("submits a search when the socket connects", async () => {
    await renderSearch();
    await waitFor(() => expect(io).toHaveBeenCalledWith("http://localhost:5051", { reconnectionAttempts: 5 }));

    await act(async () => mockSocket.serverEmit("connect"));
    expect(mockSocket.emit).toHaveBeenCalledWith("submit_keyword", {
      userId: "me-1",
      query: "hikes",
    });
    expect(screen.getByText("Searching for a budy. . .")).toBeOnTheScreen();
  });

  it("stores a found match and opens the result screen", async () => {
    const { store } = await renderSearch();
    const match = { user: { _id: "friend-1", fullname: "Alex Friend" } };

    await act(async () => mockSocket.serverEmit("search_update", { matches: match }));

    expect(store.get(matchState)).toEqual(match);
    expect(screen.getByText("Alex Friend")).toBeOnTheScreen();
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Result", { platform: "ios" });
  });

  it("allows retry after no match and cancels the search", async () => {
    await renderSearch();
    await act(async () => mockSocket.serverEmit("search_update", { matches: null }));

    expect(screen.getByText(/No Users found/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Try again"));
    expect(mockSocket.emit).toHaveBeenCalledWith("submit_keyword", { userId: "me-1", query: "hikes" });

    await fireEvent.press(screen.getByText("Cancel"));
    expect(mockSocket.emit).toHaveBeenCalledWith("cancel_search", { userId: "me-1" });
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("does not connect without a user id and releases the socket on unmount", async () => {
    const view = await renderSearch({ user: null });
    expect(io).not.toHaveBeenCalled();
    await act(async () => view.unmount());
    expect(mockSocket.disconnect).not.toHaveBeenCalled();

    const connectedView = await renderSearch();
    await waitFor(() => expect(io).toHaveBeenCalled());
    await act(async () => connectedView.unmount());
    expect(mockSocket.off).toHaveBeenCalledWith("search_update");
    expect(mockSocket.off).toHaveBeenCalledWith("error");
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});
