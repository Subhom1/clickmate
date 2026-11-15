import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Provider, createStore } from "jotai";
import axios from "axios";
import ChatScreen from "../../../app/screens/ChatScreen/ChatScreen";
import { userState } from "../../../app/state/atoms/UserState";
import { matchState } from "../../../app/state/atoms/MatchState";
import { chatState } from "../../../app/state/atoms/ChatState";
import { createSocketMock } from "../../mocks/socket";

const mockNavigation = { navigate: jest.fn() };
let mockSocket;
jest.mock("@react-navigation/native", () => ({ useNavigation: () => mockNavigation }));
jest.mock("socket.io-client", () => jest.fn(() => mockSocket));
jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("../../../FirebaseConfig", () => ({ Auth: { currentUser: { getIdToken: jest.fn().mockResolvedValue("test-token") } } }));
jest.mock("../../../constant", () => ({ API_BASE_URL: "http://localhost:5051" }));
jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});

beforeEach(() => {
  jest.clearAllMocks();
  axios.get.mockReset();
  mockSocket = createSocketMock();
  mockSocket.connected = true;
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const renderChat = async ({ matchedUser = false } = {}) => {
  const store = createStore();
  store.set(userState, { _id: "me-1", email: "me@example.com" });
  store.set(chatState, "chat-1");
  if (matchedUser) {
    store.set(matchState, { user: { _id: "friend-1", fullname: "Alex Friend" } });
  }
  const view = await render(
    <Provider store={store}>
      <ChatScreen
        route={{
          params: matchedUser
            ? { platform: "ios" }
            : { platform: "ios", secondUserInfo: { _id: "friend-1", email: "alex@example.com", fullname: "Alex Friend" } },
        }}
      />
    </Provider>
  );
  return { ...view, store };
};

describe("ChatScreen", () => {
  it("opens a friend's profile from the chat header and incoming avatar", async () => {
    axios.get.mockResolvedValue({ data: {
      _id: "chat-1",
      messages: [{ sender: "friend-1", content: "Hello" }],
    } });
    await renderChat();
    expect(await screen.findByText("Hello")).toBeOnTheScreen();

    const profileButtons = screen.getAllByLabelText("View Alex Friend profile");
    expect(profileButtons).toHaveLength(2);
    await fireEvent.press(profileButtons[0]);
    await fireEvent.press(profileButtons[1]);
    expect(mockNavigation.navigate).toHaveBeenCalledTimes(2);
    expect(mockNavigation.navigate).toHaveBeenCalledWith("VisitorProfile", {
      userId: "friend-1",
      userEmail: "alex@example.com",
      platform: "ios",
    });
  });

  it("opens a discovered match's profile before any messages arrive", async () => {
    axios.get.mockResolvedValue({ data: { _id: "chat-1", messages: [] } });
    await renderChat({ matchedUser: true });

    await fireEvent.press(screen.getByLabelText("View Alex Friend profile"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("VisitorProfile", {
      userId: "friend-1",
      userEmail: undefined,
      platform: "ios",
    });
  });

  it("loads history, sends and receives messages, clears the chat, and leaves", async () => {
    axios.get.mockResolvedValue({
      data: {
        _id: "chat-1",
        messages: [
          { sender: "me-1", content: "Earlier message" },
          { sender: "friend-1", content: "Reply" },
        ],
      },
    });
    const { store } = await renderChat();

    expect(await screen.findByText("Earlier message")).toBeOnTheScreen();
    expect(screen.getByText("Reply")).toBeOnTheScreen();
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("joinChat", { chatId: "chat-1" });
      expect(mockSocket.emit).toHaveBeenCalledWith("markAsRead", { chatId: "chat-1", userId: "me-1" });
    });
    expect(store.get(chatState)).toBe("chat-1");

    await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "New note");
    await fireEvent.press(screen.getByText("Send"));
    expect(mockSocket.emit).toHaveBeenCalledWith("sendMessage", {
      chatId: "chat-1",
      message: { sender: "me-1", content: "New note" },
    });

    await act(async () => {
      mockSocket.serverEmit("receiveMessage", { sender: "friend-1", content: "Live note" });
    });
    expect(screen.getByText("Live note")).toBeOnTheScreen();
    expect(mockSocket.emit).toHaveBeenCalledWith("markAsRead", { chatId: "chat-1", userId: "me-1" });

    await fireEvent.press(screen.getByText("delete"));
    expect(mockSocket.emit).toHaveBeenCalledWith("clearMessages", { chatId: "chat-1" });
    await fireEvent.press(screen.getByText("arrow-back-ios-new"));
    expect(mockSocket.emit).toHaveBeenCalledWith("leaveChat", { chatId: "chat-1" });
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Tab", {
      screen: "People",
      params: { platform: "ios" },
    });

  });

  it("uses the match atom, refreshes the user on exit, and cleans up", async () => {
    axios.get.mockResolvedValue({ data: { _id: "chat-1", messages: [] } });
    const view = await renderChat({ matchedUser: true });
    expect(await screen.findByText("Alex Friend")).toBeOnTheScreen();

    await act(async () => view.unmount());
    expect(mockSocket.off).toHaveBeenCalledWith("receiveMessage");
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("http://localhost:5051/user/me@example.com", { headers: { Authorization: "Bearer test-token" } })
    );
  });

  it("rejects an empty draft without sending a socket message", async () => {
    axios.get.mockResolvedValue({ data: { _id: "chat-1", messages: [] } });
    await renderChat();
    await waitFor(() => expect(mockSocket.emit).toHaveBeenCalledWith("joinChat", { chatId: "chat-1" }));
    mockSocket.emit.mockClear();

    await fireEvent.press(screen.getByText("Send"));

    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("Message...").props.value).toBe("");
  });

  it("shows an outgoing message only after the server broadcasts it", async () => {
    axios.get.mockResolvedValue({ data: { _id: "chat-1", messages: [] } });
    await renderChat();
    await waitFor(() => expect(mockSocket.emit).toHaveBeenCalledWith("joinChat", { chatId: "chat-1" }));
    await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "Server confirmed");
    await fireEvent.press(screen.getByText("Send"));
    expect(mockSocket.emit).toHaveBeenCalledWith("sendMessage", {
      chatId: "chat-1", message: { sender: "me-1", content: "Server confirmed" },
    });
    expect(screen.queryByText("Server confirmed")).toBeNull();

    await act(async () => {
      mockSocket.serverEmit("receiveMessage", { sender: "me-1", content: "Server confirmed" });
    });

    expect(screen.getAllByText("Server confirmed")).toHaveLength(1);
    expect(screen.getAllByLabelText("View Alex Friend profile")).toHaveLength(1);
  });

  it("replaces the selected chat atom with the fetched ID and uses it for sending", async () => {
    axios.get.mockResolvedValue({ data: { _id: "resolved-chat", messages: [] } });
    const { store } = await renderChat();
    await waitFor(() => expect(store.get(chatState)).toBe("resolved-chat"));

    await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "Correct room");
    await fireEvent.press(screen.getByText("Send"));

    expect(mockSocket.emit).toHaveBeenCalledWith("sendMessage", {
      chatId: "resolved-chat", message: { sender: "me-1", content: "Correct room" },
    });
    expect(mockSocket.emit).toHaveBeenCalledWith("joinChat", { chatId: "resolved-chat" });
  });

  it("preserves the selected chat and avoids joining when history fails", async () => {
    const error = new Error("History unavailable");
    jest.spyOn(console, "error").mockImplementation(() => {});
    axios.get.mockRejectedValue(error);
    const { store } = await renderChat();

    await waitFor(() => expect(console.error).toHaveBeenCalledWith(error, "fetch chat error"));

    expect(store.get(chatState)).toBe("chat-1");
    expect(screen.getByText("Alex Friend")).toBeOnTheScreen();
    expect(mockSocket.emit).not.toHaveBeenCalledWith("joinChat", expect.anything());
    expect(mockSocket.emit).not.toHaveBeenCalledWith("markAsRead", expect.anything());
  });

  it("reloads cleared history after server confirmation and expires the toast", async () => {
    jest.useFakeTimers();
    axios.get
      .mockResolvedValueOnce({ data: { _id: "chat-1", messages: [{ sender: "friend-1", content: "Old history" }] } })
      .mockResolvedValueOnce({ data: { _id: "chat-1", messages: [] } });
    await renderChat();
    expect(await screen.findByText("Old history")).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("delete"));
    expect(screen.getByText("Old history")).toBeOnTheScreen();
    await act(async () => mockSocket.serverEmit("messagesCleared"));

    await waitFor(() => expect(screen.queryByText("Old history")).toBeNull());
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(screen.getByText("All chats cleared")).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(3499));
    expect(screen.getByText("All chats cleared")).toBeOnTheScreen();
    await act(async () => jest.advanceTimersByTime(1));
    expect(screen.queryByText("All chats cleared")).toBeNull();
  });

});
