import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Provider, createStore } from "jotai";
import axios from "axios";
import Explore from "../../../app/screens/Explore";
import { exploreState } from "../../../app/state/atoms/ExploreState";

const mockNavigate = jest.fn();
jest.mock("expo-router/react-navigation", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("../../../constant", () => ({ IP: "localhost" }));
jest.mock("../../../app/components/CarouselComp", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return function MockCarousel({ dataArr, onPress, itemMain }) {
    return dataArr?.map((item) => (
      <Pressable key={item.text} onPress={() => onPress(item, itemMain)}>
        <Text>{item.text}</Text>
      </Pressable>
    ));
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

const renderExplore = async (initialData = null) => {
  const store = createStore();
  if (initialData) store.set(exploreState, initialData);
  const view = await render(
    <Provider store={store}>
      <Explore route={{ params: { platform: "ios" } }} />
    </Provider>
  );
  return { ...view, store };
};

describe("Explore", () => {
  it("shows a loading state while fetching activities", async () => {
    axios.get.mockReturnValue(new Promise(() => {}));
    await renderExplore();

    expect(screen.getByText("Loading activities...")).toBeOnTheScreen();
    expect(axios.get).toHaveBeenCalledWith("http://localhost:5051/explore");
  });

  it("loads activities and opens a selected category", async () => {
    axios.get.mockResolvedValue({
      data: [{ category: "hikes", list: [{ text: "Coastal walk", imgUrl: "/walk.jpg" }] }],
    });
    await renderExplore();

    expect(await screen.findByText("Hikes to do together")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Coastal walk"));
    expect(mockNavigate).toHaveBeenCalledWith("ExploreSearch", {
      item: { text: "Coastal walk", imgUrl: "/walk.jpg" },
      itemTitle: "hikes",
      platform: "ios",
    });
  });

  it("shows a retry action after a failed request", async () => {
    const error = new Error("offline");
    jest.spyOn(console, "error").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(error).mockResolvedValueOnce({ data: [] });
    await renderExplore();

    expect(await screen.findByText("We couldn't load activities right now.")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Try again"));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText("Try again")).toBeNull());
  });
});
