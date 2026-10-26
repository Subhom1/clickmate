import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import ToggleSwitch from "../../app/components/ToggleSwitch";

describe("ToggleSwitch", () => {
  it("shows the default global selection", async () => {
    await render(<ToggleSwitch />);
    expect(screen.getByText("Global")).toBeOnTheScreen();
    expect(screen.queryByText("Local")).toBeNull();
  });
});
