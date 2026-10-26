import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Provider, createStore } from "jotai";
import axios from "axios";
import Result from "../../../app/screens/Result";
import { matchState } from "../../../app/state/atoms/MatchState";
import { userState } from "../../../app/state/atoms/UserState";
import { chatState } from "../../../app/state/atoms/ChatState";

const mockNavigation = { navigate: jest.fn() };
jest.mock("expo-router/react-navigation", () => ({ useNavigation: () => mockNavigation }));
jest.mock("axios", () => ({ post: jest.fn() }));
jest.mock("../../../constant", () => ({ IP: "localhost" }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

const renderResult = async ({ user, matchedUser } = {}) => {
  const store = createStore();
  if (user) store.set(userState, user);
  if (matchedUser) store.set(matchState, { user: matchedUser });
  const view = await render(
    <Provider store={store}>
      <Result route={{ params: { platform: "ios" } }} />
    </Provider>
  );
  return { ...view, store };
};

describe("Result", () => {
  it("creates a chat for the matched users and opens it", async () => {
    axios.post.mockResolvedValue({ data: { _id: "chat-1" } });
    const { store } = await renderResult({
      user: { _id: "me-1" },
      matchedUser: { _id: "friend-1", fullname: "Alex Friend" },
    });

    expect(screen.getByText("Alex Friend")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Chat"));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith("http://localhost:5051/create-chat", {
        user1Id: "me-1",
        user2Id: "friend-1",
      })
    );
    expect(store.get(chatState)).toBe("chat-1");
    expect(mockNavigation.navigate).toHaveBeenCalledWith("ChatScreen", { platform: "ios" });
  });

  it("asks the user to start a new search when match data is missing", async () => {
    await renderResult({ user: { _id: "me-1" } });
    await fireEvent.press(screen.getByText("Chat"));

    expect(Alert.alert).toHaveBeenCalledWith("Match unavailable", "Please start a new search");
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("returns to the tabs to start another search", async () => {
    await renderResult();
    await fireEvent.press(screen.getByText("New Search"));

    expect(mockNavigation.navigate).toHaveBeenCalledWith("Tab", { params: { platform: "ios" } });
  });
});
