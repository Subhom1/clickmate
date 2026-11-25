import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Provider, createStore } from "jotai";
import axios from "axios";
import io from "socket.io-client";
import People from "../../../app/screens/People";
import { userState } from "../../../app/state/atoms/UserState";
import { createSocketMock } from "../../mocks/socket";
import { Auth } from "../../../FirebaseConfig";

const mockNavigation = { navigate: jest.fn() };
let mockSocket;
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: (callback) => require("react").useEffect(callback, [callback]),
}));
jest.mock("socket.io-client", () => jest.fn(() => mockSocket));
jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("../../../constant", () => ({ API_BASE_URL: "http://localhost:5051" }));
jest.mock("../../../FirebaseConfig", () => ({ Auth: { currentUser: { getIdToken: jest.fn() } } }));
jest.mock("@expo/vector-icons/AntDesign", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSocket = createSocketMock();
  Auth.currentUser.getIdToken.mockResolvedValue("fresh-token");
});

const friends = [{ _id: "friend-1", fullname: "Alex Friend", email: "alex@example.com" }];
const mockResponses = (unread = [], refreshedFriends = friends) => {
  axios.get.mockImplementation((url) => Promise.resolve({
    data: url.includes("/friends") ? refreshedFriends : unread,
  }));
};
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
    mockResponses([], []);
    await renderPeople({ _id: "me-1", friends: [] });
    expect(screen.getByText("Search to find people like you")).toBeOnTheScreen();
    expect(axios.get).toHaveBeenCalledWith("http://localhost:5051/unread-messages/me-1", {
      headers: { Authorization: "Bearer fresh-token" },
    });
    const [url, options] = io.mock.calls[0];
    expect(url).toBe("http://localhost:5051");
    const provideAuth = jest.fn();
    await options.auth(provideAuth);
    expect(provideAuth).toHaveBeenCalledWith({ token: "fresh-token" });
  });

  it("loads unread counts and opens friend profiles and chats", async () => {
    mockResponses([{ userId: "friend-1", count: 2 }]);
    const { store } = await renderPeople();

    expect(await screen.findByText("2")).toBeOnTheScreen();
    expect(store.get(userState).friends).toEqual(friends);

    await fireEvent.press(screen.getByText("Alex Friend"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("VisitorProfile", {
      userEmail: "alex@example.com",
    });
    await fireEvent.press(screen.getByText("message"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("ChatScreen", { secondUserInfo: expect.objectContaining({ _id: "friend-1", count: 2 }) });
  });

  it("shows profile changes from another device when the friends list opens", async () => {
    mockResponses([], [{ ...friends[0], fullname: "Alex Updated" }]);
    const { store } = await renderPeople();

    expect(await screen.findByText("Alex Updated")).toBeOnTheScreen();
    expect(store.get(userState).friends[0].fullname).toBe("Alex Updated");
  });

  it("shows a friend's avatar when supplied and initials otherwise", async () => {
    mockResponses([], [
      { ...friends[0], avatarUrl: "https://example.com/alex.jpg" },
      { _id: "friend-2", fullname: "Sam Friend", email: "sam@example.com" },
    ]);
    await renderPeople({ _id: "me-1", friends: [
      { ...friends[0], avatarUrl: "https://example.com/alex.jpg" },
      { _id: "friend-2", fullname: "Sam Friend", email: "sam@example.com" },
    ] });
    expect(screen.getByLabelText("Alex Friend profile photo")).toHaveProp("source", { uri: "https://example.com/alex.jpg" });
    expect(screen.getByText("SF")).toBeOnTheScreen();
  });

  it("refreshes unread counts on socket updates and cleans up", async () => {
    mockResponses();
    const view = await renderPeople();
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

    await act(async () => mockSocket.serverEmit("updateUnreadCounts"));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    await act(async () => view.unmount());
    expect(mockSocket.off).toHaveBeenCalledWith("updateUnreadCounts", expect.any(Function));
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});


it("preserves friends after an unread request fails and recovers on a socket update", async () => {
  const error = new Error("offline");
  const logError = jest.spyOn(console, "error").mockImplementation(() => {});
  let unreadCalls = 0;
  axios.get.mockImplementation((url) => url.includes("/friends")
    ? Promise.resolve({ data: friends })
    : ++unreadCalls === 1 ? Promise.reject(error) : Promise.resolve({ data: [{ userId: "friend-1", count: 3 }] }));
  const { store } = await renderPeople();

  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  expect(logError).not.toHaveBeenCalled();
  expect(screen.getByText("Alex Friend")).toBeOnTheScreen();
  expect(store.get(userState).friends).toEqual(friends);

  await act(async () => mockSocket.serverEmit("updateUnreadCounts"));
  expect(await screen.findByText("3")).toBeOnTheScreen();
  expect(store.get(userState).friends).toEqual(friends);
});


test("clears old unread badges when the server reports no unread messages", async () => {
  let unreadCalls = 0;
  axios.get.mockImplementation((url) => Promise.resolve({
    data: url.includes("/friends") ? friends : ++unreadCalls === 1 ? [{ userId: "friend-1", count: 2 }] : [],
  }));
  const { store } = await renderPeople();
  expect(await screen.findByText("2")).toBeOnTheScreen();

  await act(async () => mockSocket.serverEmit("updateUnreadCounts"));
  await waitFor(() => expect(screen.queryByText("2")).toBeNull());
  expect(store.get(userState).friends).toEqual(friends);
});

it("skips the unread request when the Firebase session has no token", async () => {
  Auth.currentUser.getIdToken.mockResolvedValue(null);
  await renderPeople();
  await waitFor(() => expect(Auth.currentUser.getIdToken).toHaveBeenCalled());
  expect(axios.get).not.toHaveBeenCalled();
  expect(screen.getByText("Alex Friend")).toBeOnTheScreen();
});
