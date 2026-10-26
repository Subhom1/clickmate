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
});
