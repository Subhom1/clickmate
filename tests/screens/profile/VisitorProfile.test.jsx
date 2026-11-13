import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Provider, createStore } from "jotai";
import axios from "axios";
import VisitorProfile from "../../../app/screens/VisitorProfile";
import { userState } from "../../../app/state/atoms/UserState";

const mockNavigation = { goBack: jest.fn() };
jest.mock("@react-navigation/native", () => ({ useNavigation: () => mockNavigation }));
jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("../../../constant", () => ({ API_BASE_URL: "http://localhost:5051" }));
jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});

const friends = [
  { _id: "friend-1", email: "alex@example.com", fullname: "Alex Friend", bio: "Enjoys weekend hikes.", interests: ["i-1"] },
  { _id: "friend-2", email: "sam@example.com", fullname: "Sam Friend", bio: "Second visitor", interests: [] },
];

const renderProfile = async (userEmail, userFriends = friends) => {
  const store = createStore();
  store.set(userState, { _id: "me-1", friends: userFriends });
  const view = await render(
    <Provider store={store}>
      <VisitorProfile route={{ params: { userEmail, platform: "ios" } }} />
    </Provider>
  );
  return { ...view, store };
};

beforeEach(() => jest.resetAllMocks());

describe("VisitorProfile", () => {
  it("shows a friend from the signed-in user's list and resolves their interests", async () => {
    axios.get.mockResolvedValue({ data: [{ _id: "i-1", text: "Hiking" }] });
    await renderProfile("alex@example.com");

    expect(await screen.findByText("Alex Friend")).toBeOnTheScreen();
    expect(screen.getByText("Enjoys weekend hikes.")).toBeOnTheScreen();
    expect(await screen.findByText("Hiking")).toBeOnTheScreen();
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith("http://localhost:5051/interests");

    await fireEvent.press(screen.getByText("arrow-back-ios-new"));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("does not request a profile without a friend in the signed-in user's list", async () => {
    await renderProfile("stranger@example.com");
    expect(axios.get).not.toHaveBeenCalled();
    expect(screen.queryByText("Interests")).toBeNull();
  });

  it("keeps the friend's profile visible if interest names fail to load", async () => {
    axios.get.mockRejectedValue(new Error("offline"));
    await renderProfile("alex@example.com");
    expect(await screen.findByText("Alex Friend")).toBeOnTheScreen();
    expect(screen.getByText("Enjoys weekend hikes.")).toBeOnTheScreen();
    expect(screen.queryByText("Interests")).toBeNull();
  });

  it("shows the newly selected friend when the route changes", async () => {
    axios.get.mockResolvedValue({ data: [{ _id: "i-1", text: "Hiking" }] });
    const { rerender, store } = await renderProfile("alex@example.com");
    expect(await screen.findByText("Hiking")).toBeOnTheScreen();

    await rerender(
      <Provider store={store}>
        <VisitorProfile route={{ params: { userEmail: "sam@example.com", platform: "ios" } }} />
      </Provider>
    );
    expect(await screen.findByText("Sam Friend")).toBeOnTheScreen();
    expect(screen.getByText("Second visitor")).toBeOnTheScreen();
    expect(screen.queryByText("Alex Friend")).toBeNull();
    expect(screen.queryByText("Hiking")).toBeNull();
  });
});
