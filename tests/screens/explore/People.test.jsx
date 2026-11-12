import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Provider, createStore } from "jotai";
import axios from "axios";
import io from "socket.io-client";
import People from "../../../app/screens/People";
import { userState } from "../../../app/state/atoms/UserState";
import { createSocketMock } from "../../mocks/socket";

const mockNavigation = { navigate: jest.fn() };
let mockSocket;
jest.mock("@react-navigation/native", () => ({ useNavigation: () => mockNavigation }));
jest.mock("socket.io-client", () => jest.fn(() => mockSocket));
jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("../../../constant", () => ({ IP: "localhost" }));
jest.mock("@expo/vector-icons/AntDesign", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSocket = createSocketMock();
});

const friends = [{ _id: "friend-1", fullname: "Alex Friend", email: "alex@example.com" }];
const renderPeople = async (user = { _id: "me-1", friends }) => {
  const store = createStore();
  store.set(userState, user);
  const view = await render(
    <Provider store={store}>
      <People route={{ params: { platform: "ios" } }} />
    </Provider>
  );
  return { ...view, store };
};

afterEach(() => jest.restoreAllMocks());

describe("People", () => {
  it("shows an empty state when there are no friends", async () => {
    axios.get.mockResolvedValue({ data: [] });
    await renderPeople({ _id: "me-1", friends: [] });
    expect(screen.getByText("Search to find people like you")).toBeOnTheScreen();
    expect(axios.get).toHaveBeenCalledWith("http://localhost:5051/unread-messages/me-1");
  });

  it("loads unread counts and opens friend profiles and chats", async () => {
    axios.get.mockResolvedValue({ data: [{ userId: "friend-1", count: 2 }] });
    const { store } = await renderPeople();

    expect(await screen.findByText("2")).toBeOnTheScreen();
    await waitFor(() => expect(store.get(userState).friends[0].count).toBe(2));

    await fireEvent.press(screen.getByText("Alex Friend"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("VisitorProfile", {
      userEmail: "alex@example.com",
    });
    await fireEvent.press(screen.getByText("message"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("ChatScreen", { secondUserInfo: expect.objectContaining({ _id: "friend-1" }) });
  });

  it("shows a friend's avatar when supplied and initials otherwise", async () => {
    axios.get.mockResolvedValue({ data: [] });
    await renderPeople({ _id: "me-1", friends: [
      { ...friends[0], avatarUrl: "https://example.com/alex.jpg" },
      { _id: "friend-2", fullname: "Sam Friend", email: "sam@example.com" },
    ] });
    expect(screen.getByLabelText("Alex Friend profile photo")).toHaveProp("source", { uri: "https://example.com/alex.jpg" });
    expect(screen.getByText("SF")).toBeOnTheScreen();
  });

  it("refreshes unread counts on socket updates and cleans up", async () => {
    axios.get.mockResolvedValue({ data: [] });
    const view = await renderPeople();
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    await act(async () => mockSocket.serverEmit("updateUnreadCounts"));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

    await act(async () => view.unmount());
    expect(mockSocket.off).toHaveBeenCalledWith("updateUnreadCounts");
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});


it("preserves friends after an unread request fails and recovers on a socket update", async () => {
  const error = new Error("offline");
  jest.spyOn(console, "error").mockImplementation(() => {});
  axios.get.mockRejectedValueOnce(error).mockResolvedValueOnce({ data: [{ userId: "friend-1", count: 3 }] });
  const { store } = await renderPeople();

  await waitFor(() => expect(console.error).toHaveBeenCalledWith(error));
  expect(screen.getByText("Alex Friend")).toBeOnTheScreen();
  expect(store.get(userState).friends).toEqual(friends);

  await act(async () => mockSocket.serverEmit("updateUnreadCounts"));
  expect(await screen.findByText("3")).toBeOnTheScreen();
  expect(store.get(userState).friends[0].count).toBe(3);
});
