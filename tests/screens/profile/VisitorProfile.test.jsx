import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Provider, createStore } from "jotai";
import axios from "axios";
import VisitorProfile from "../../../app/screens/VisitorProfile";
import { userState } from "../../../app/state/atoms/UserState";
import { Auth } from "../../../FirebaseConfig";

const mockNavigation = { goBack: jest.fn() };
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: (callback) => require("react").useEffect(callback, [callback]),
}));
jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("../../../constant", () => ({ API_BASE_URL: "http://localhost:5051" }));
jest.mock("../../../FirebaseConfig", () => ({ Auth: { currentUser: { getIdToken: jest.fn() } } }));
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

beforeEach(() => {
  jest.resetAllMocks();
  Auth.currentUser.getIdToken.mockResolvedValue("fresh-token");
});

const mockResponses = (refreshedFriends = friends, interests = [{ _id: "i-1", text: "Hiking" }]) => {
  axios.get.mockImplementation((url) => Promise.resolve({
    data: url.includes("/friends") ? refreshedFriends : interests,
  }));
};

describe("VisitorProfile", () => {
  it("shows a friend from the signed-in user's list and resolves their interests", async () => {
    mockResponses();
    await renderProfile("alex@example.com");

    expect(await screen.findByText("Alex Friend")).toBeOnTheScreen();
    expect(screen.getByText("Enjoys weekend hikes.")).toBeOnTheScreen();
    expect(await screen.findByText("Hiking")).toBeOnTheScreen();
    expect(axios.get).toHaveBeenCalledWith("http://localhost:5051/users/me-1/friends", {
      headers: { Authorization: "Bearer fresh-token" },
    });
    expect(axios.get).toHaveBeenCalledWith("http://localhost:5051/interests");

    await fireEvent.press(screen.getByText("arrow-back-ios-new"));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("does not request a profile without a friend in the signed-in user's list", async () => {
    await renderProfile("stranger@example.com");
    expect(axios.get).toHaveBeenCalledWith("http://localhost:5051/users/me-1/friends", {
      headers: { Authorization: "Bearer fresh-token" },
    });
    expect(screen.queryByText("Interests")).toBeNull();
  });

  it("keeps the friend's profile visible if interest names fail to load", async () => {
    axios.get.mockImplementation((url) => url.includes("/friends")
      ? Promise.resolve({ data: friends })
      : Promise.reject(new Error("offline")));
    await renderProfile("alex@example.com");
    expect(await screen.findByText("Alex Friend")).toBeOnTheScreen();
    expect(screen.getByText("Enjoys weekend hikes.")).toBeOnTheScreen();
    expect(screen.queryByText("Interests")).toBeNull();
  });

  it("shows saved details with a warning when the profile refresh fails", async () => {
    axios.get.mockImplementation((url) => url.includes("/friends")
      ? Promise.reject(new Error("offline"))
      : Promise.resolve({ data: [{ _id: "i-1", text: "Hiking" }] }));
    await renderProfile("alex@example.com");

    expect(await screen.findByText("Could not refresh this profile. Showing saved details.")).toBeOnTheScreen();
    expect(screen.getByText("Alex Friend")).toBeOnTheScreen();
  });

  it("shows the newly selected friend when the route changes", async () => {
    mockResponses();
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

  it("replaces saved profile details with another device's updates", async () => {
    mockResponses([{ ...friends[0], fullname: "Alex Updated", bio: "New bio", avatarUrl: "https://photos.example/new.jpg", interests: [{ _id: "i-2", text: "Cycling" }] }]);
    const { store } = await renderProfile("alex@example.com");

    expect(await screen.findByText("Alex Updated")).toBeOnTheScreen();
    expect(screen.getByText("New bio")).toBeOnTheScreen();
    expect(screen.getByText("Cycling")).toBeOnTheScreen();
    expect(screen.getByLabelText("Alex Updated profile photo")).toHaveProp("source", { uri: "https://photos.example/new.jpg" });
    expect(store.get(userState).friends[0].fullname).toBe("Alex Updated");
  });

  it("finds a friend by ID when chat opens the profile", async () => {
    mockResponses();
    const store = createStore();
    store.set(userState, { _id: "me-1", friends });
    await render(
      <Provider store={store}>
        <VisitorProfile route={{ params: { userId: "friend-1", platform: "ios" } }} />
      </Provider>
    );

    expect(await screen.findByText("Alex Friend")).toBeOnTheScreen();
    expect(screen.getByText("Enjoys weekend hikes.")).toBeOnTheScreen();
  });

  it("loads a newer profile when the friend page is opened again", async () => {
    mockResponses();
    const firstVisit = await renderProfile("alex@example.com");
    expect(await screen.findByText("Alex Friend")).toBeOnTheScreen();
    await firstVisit.unmount();

    mockResponses([{ ...friends[0], fullname: "Alex Again", bio: "Changed elsewhere", interests: [] }]);
    await render(
      <Provider store={firstVisit.store}>
        <VisitorProfile route={{ params: { userEmail: "alex@example.com", platform: "ios" } }} />
      </Provider>
    );

    expect(await screen.findByText("Alex Again")).toBeOnTheScreen();
    expect(screen.getByText("Changed elsewhere")).toBeOnTheScreen();
  });
});
