import React from "react";
import { render, screen } from "@testing-library/react-native";
import MySpace from "../../app/screens/MySpace";

it("renders a blank screen that fills the available space", async () => {
  await render(<MySpace />);
  const page = screen.getByTestId("my-space-screen");
  expect(page).toHaveStyle({ flex: 1, backgroundColor: "#FFFFFF" });
  expect(page.children).toHaveLength(0);
});
