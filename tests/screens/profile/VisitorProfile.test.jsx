import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import axios from "axios";
import VisitorProfile from "../../../app/screens/VisitorProfile";

const mockNavigation = { goBack: jest.fn() };
jest.mock("expo-router/react-navigation", () => ({ useNavigation: () => mockNavigation }));
jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("../../../constant", () => ({ IP: "localhost" }));
jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});

beforeEach(() => jest.resetAllMocks());

describe("VisitorProfile", () => {
  it("loads a visitor profile and returns to the previous screen", async () => {
    axios.get.mockResolvedValue({
      data: {
        fullname: "Alex Friend",
        bio: "Enjoys weekend hikes.",
        interests: [{ _id: "i-1", text: "Hiking" }],
      },
    });
    await render(
      <VisitorProfile route={{ params: { userEmail: "alex@example.com", platform: "ios" } }} />
    );

    expect(await screen.findByText("Alex Friend")).toBeOnTheScreen();
    expect(screen.getByText("Enjoys weekend hikes.")).toBeOnTheScreen();
    expect(screen.getByText("Hiking")).toBeOnTheScreen();
    expect(axios.get).toHaveBeenCalledWith("http://localhost:5051/user/alex@example.com");

    await fireEvent.press(screen.getByText("arrow-back-ios-new"));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("does not request a profile without an email", async () => {
    await render(<VisitorProfile route={{ params: { platform: "android" } }} />);
    await waitFor(() => expect(axios.get).not.toHaveBeenCalled());
    expect(screen.queryByText("Interests")).toBeNull();
  });
});


it("reloads the selected visitor when the route email changes and hides empty interests", async () => {
  axios.get.mockResolvedValueOnce({ data: {
    fullname: "Alex Friend", bio: "First visitor", interests: [{ _id: "i-1", text: "Hiking" }],
  } }).mockResolvedValueOnce({ data: {
    fullname: "Sam Friend", bio: "Second visitor", interests: [],
  } });
  const view = await render(
    <VisitorProfile route={{ params: { userEmail: "alex@example.com", platform: "ios" } }} />
  );
  expect(await screen.findByText("Hiking")).toBeOnTheScreen();

  await view.rerender(
    <VisitorProfile route={{ params: { userEmail: "sam@example.com", platform: "ios" } }} />
  );
  expect(await screen.findByText("Sam Friend")).toBeOnTheScreen();
  expect(screen.getByText("Second visitor")).toBeOnTheScreen();
  expect(screen.queryByText("Alex Friend")).toBeNull();
  expect(screen.queryByText("Hiking")).toBeNull();
  expect(screen.queryByText("Interests")).toBeNull();
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(axios.get).toHaveBeenLastCalledWith("http://localhost:5051/user/sam@example.com");
});
