import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import CarouselComp from "../../app/components/CarouselComp";

jest.mock("../../constant", () => ({ IP: "localhost" }));
jest.mock("react-native-reanimated-carousel", () => {
  const React = require("react");
  return {
    Carousel: ({ data, renderItem }) =>
      React.createElement(
        React.Fragment,
        null,
        data.map((item, index) => React.createElement(React.Fragment, { key: item.text }, renderItem({ item, index })))
      ),
  };
});

describe("CarouselComp", () => {
  it("renders activity cards and reports the selected item and category", async () => {
    const onPress = jest.fn();
    const item = { text: "Coastal walk", imgUrl: "/walk.jpg" };
    const category = { category: "hikes" };
    await render(
      <CarouselComp width={360} dataArr={[item]} itemMain={category} onPress={onPress} />
    );

    await fireEvent.press(screen.getByText("Coastal walk"));
    expect(onPress).toHaveBeenCalledWith(item, category);
  });
});
