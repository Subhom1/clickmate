import React, { useState } from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { createStore } from "jotai";
import axios from "axios";
import io from "socket.io-client";
import ExploreSearch from "../../app/screens/ExploreSearch";
import Result from "../../app/screens/Result";
import ChatScreen from "../../app/screens/ChatScreen/ChatScreen";
import { userState } from "../../app/state/atoms/UserState";
import { matchState } from "../../app/state/atoms/MatchState";
import { chatState } from "../../app/state/atoms/ChatState";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { createSocketMock } from "../mocks/socket";

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
let mockSockets;
jest.mock("expo-router/react-navigation", () => ({ useNavigation: () => mockNavigation }));
jest.mock("socket.io-client", () => jest.fn());
jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../constant", () => ({ IP: "localhost" }));
jest.mock("react-native-root-toast", () => ({ show: jest.fn(), hide: jest.fn(), durations: { LONG: 3000 } }));
jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});

const friend = { _id: "friend-1", fullname: "Alex Friend" };

// Only navigation is replaced: screens mount/unmount with one real Jotai store.
// This exercises route handoffs, not the native navigation implementation.
function Flow() {
  const [route, setRoute] = useState({
    name: "ExploreSearch",
    params: { platform: "ios", itemTitle: "hikes", item: { text: "Trail", imgUrl: "/trail.png" } },
  });
  mockNavigation.navigate.mockImplementation((name, params) => setRoute({ name, params }));
  const Component = { ExploreSearch, Result, ChatScreen }[route.name];
  return <Component route={route} />;
}

beforeEach(() => {
  jest.resetAllMocks();
  mockSockets = [];
  io.mockImplementation(() => {
    const socket = createSocketMock();
    socket.connected = true;
    mockSockets.push(socket);
    return socket;
  });
  axios.post.mockResolvedValue({ data: { _id: "created-chat" } });
  axios.get.mockImplementation(async (url) => ({ data: url.includes("/chat/")
    ? { _id: "created-chat", messages: [] }
    : { _id: "me-1", email: "me@example.com", fullname: "Current User" } }));
});
afterEach(() => jest.restoreAllMocks());

async function startSearch() {
  const store = createStore();
  store.set(userState, { _id: "me-1", email: "me@example.com" });
  const view = await renderWithProviders(<Flow />, { store });
  const searchSocket = mockSockets[0];
  // A real connect event submits the category; no client-side echo is simulated.
  jest.spyOn(console, "log").mockImplementation(() => {});
  await act(async () => searchSocket.serverEmit("connect"));
  expect(searchSocket.emit).toHaveBeenCalledWith("submit_keyword", { userId: "me-1", query: "hikes" });
  return { ...view, store, searchSocket };
}

async function findMatch(searchSocket) {
  await act(async () => searchSocket.serverEmit("search_update", { matches: { user: friend } }));
  expect(screen.getByText("Alex Friend")).toBeOnTheScreen();
  expect(searchSocket.disconnect).toHaveBeenCalledTimes(1);
}

it("carries a discovered match into chat history, sending, and incoming avatars", async () => {
  axios.get.mockImplementation(async (url) => ({ data: url.includes("/chat/")
    ? { _id: "created-chat", messages: [{ sender: "friend-1", content: "Trail history" }] }
    : { _id: "me-1", email: "me@example.com" } }));
  const { store, searchSocket, unmount } = await startSearch();
  await findMatch(searchSocket);
  expect(store.get(matchState)).toEqual({ user: friend });
  await fireEvent.press(screen.getByText("Chat"));
  expect(await screen.findByText("Trail history")).toBeOnTheScreen();
  expect(axios.post).toHaveBeenCalledWith("http://localhost:5051/create-chat", { user1Id: "me-1", user2Id: "friend-1" });
  expect(axios.get).toHaveBeenCalledWith("http://localhost:5051/chat/me-1/friend-1");
  expect(store.get(chatState)).toBe("created-chat");
  const chatSocket = mockSockets[1];
  expect(chatSocket.emit).toHaveBeenCalledWith("joinChat", { chatId: "created-chat" });
  await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "Meet at noon");
  await fireEvent.press(screen.getByText("Send"));
  expect(chatSocket.emit).toHaveBeenCalledWith("sendMessage", {
    chatId: "created-chat", message: { sender: "me-1", content: "Meet at noon" },
  });
  await act(async () => chatSocket.serverEmit("receiveMessage", { sender: "friend-1", content: "See you there" }));
  expect(screen.getByText("See you there")).toBeOnTheScreen();
  expect(screen.getAllByText("AF")).toHaveLength(2);
  await unmount();
  expect(chatSocket.disconnect).toHaveBeenCalledTimes(1);
});

it("recovers from an empty search into a fresh result without reviving a stale match", async () => {
  const { store, searchSocket } = await startSearch();
  await act(async () => store.set(matchState, { user: { _id: "old", fullname: "Old Match" } }));
  await act(async () => searchSocket.serverEmit("search_update", { matches: null }));
  expect(store.get(matchState)).toBeNull();
  expect(screen.getByText(/No Users found/)).toBeOnTheScreen();
  expect(mockNavigation.navigate).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText("Try again"));
  expect(searchSocket.emit.mock.calls.filter(([event]) => event === "submit_keyword")).toHaveLength(2);
  await findMatch(searchSocket);
  expect(store.get(matchState)).toEqual({ user: friend });
  expect(screen.queryByText("Old Match")).toBeNull();
  expect(axios.post).not.toHaveBeenCalled();
});

it("keeps the discovered result after chat creation fails and opens chat after retry", async () => {
  const error = new Error("Chat service unavailable");
  jest.spyOn(console, "error").mockImplementation(() => {});
  axios.post.mockRejectedValueOnce(error).mockResolvedValueOnce({ data: { _id: "created-chat" } });
  const { store, searchSocket, unmount } = await startSearch();
  await findMatch(searchSocket);
  await fireEvent.press(screen.getByText("Chat"));
  await waitFor(() => expect(console.error).toHaveBeenCalledWith(error, "Error creating chat"));
  expect(screen.getByText("Alex Friend")).toBeOnTheScreen();
  expect(store.get(matchState)).toEqual({ user: friend });
  expect(store.get(chatState)).toBeNull();
  expect(mockSockets).toHaveLength(1);
  await fireEvent.press(screen.getByText("Chat"));
  expect(await screen.findByPlaceholderText("Message...")).toBeOnTheScreen();
  await waitFor(() => expect(mockSockets[1].emit).toHaveBeenCalledWith("joinChat", { chatId: "created-chat" }));
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(store.get(chatState)).toBe("created-chat");
  await unmount();
});
