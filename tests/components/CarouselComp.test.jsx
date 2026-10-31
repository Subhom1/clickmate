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


it("replaces old carousel cards and selects from the new category", async () => {
  const onPress = jest.fn();
  const previous = { text: "Old activity", imgUrl: "/old.jpg" };
  const current = { text: "New activity", imgUrl: "/new.jpg" };
  const category = { category: "new-category" };
  const view = await render(<CarouselComp width={360} dataArr={[previous]} itemMain={{ category: "old" }} onPress={onPress} />);
  await view.rerender(<CarouselComp width={360} dataArr={[current]} itemMain={category} onPress={onPress} />);
  expect(screen.queryByText("Old activity")).toBeNull();
  await fireEvent.press(screen.getByText("New activity"));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onPress).toHaveBeenCalledWith(current, category);
  await view.rerender(<CarouselComp width={360} dataArr={[]} itemMain={category} onPress={onPress} />);
  expect(screen.queryByText("New activity")).toBeNull();
  expect(onPress).toHaveBeenCalledTimes(1);
});
