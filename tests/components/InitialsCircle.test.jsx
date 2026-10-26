import React from "react";
import { render, screen } from "@testing-library/react-native";
import { InitialsCircle } from "../../app/components/CreateAvatar";

describe("InitialsCircle", () => {
  it("renders the uppercase initials for a person's name", async () => {
    await render(
      <InitialsCircle
        name="Ada Lovelace"
        styles={{ circle: {}, initials: {} }}
      />
    );

    expect(screen.getByText("AL")).toBeOnTheScreen();
  });

  it("renders a single initial for a single name", async () => {
    await render(<InitialsCircle name="ada" styles={{}} />);
    expect(screen.getByText("A")).toBeOnTheScreen();
  });

  it("renders no initials for an empty name", async () => {
    await render(<InitialsCircle name="" styles={{}} />);
    expect(screen.getByText("")).toBeOnTheScreen();
  });

  it("updates the displayed initials when the person changes", async () => {
    const view = await render(<InitialsCircle name="Ada Lovelace" styles={{}} />);
    await view.rerender(<InitialsCircle name="Grace Hopper" styles={{}} />);
    expect(screen.getByText("GH")).toBeOnTheScreen();
    expect(screen.queryByText("AL")).toBeNull();
  });

  it.each([
    [true, "#67AB0F"],
    [false, "#A7B0AD"],
  ])("shows the navigation color when focused is %s", async (focused, backgroundColor) => {
    await render(<InitialsCircle name="Ada" styles={{}} nav focused={focused} />);
    expect(screen.getByText("A").parent).toHaveStyle({ backgroundColor });
  });

  it("preserves the caller's background outside navigation", async () => {
    await render(
      <InitialsCircle name="Ada" styles={{ circle: { backgroundColor: "purple" } }} focused />
    );
    expect(screen.getByText("A").parent).toHaveStyle({ backgroundColor: "purple" });
  });
});
