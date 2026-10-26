import React from "react";
import { Text } from "react-native";
import { atom, createStore, useAtomValue } from "jotai";
import { act } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { createSocketMock } from "../mocks/socket";

const valueAtom = atom("signed out");
function StateLabel() {
  return <Text>{useAtomValue(valueAtom)}</Text>;
}

describe("provider render helper", () => {
  it("renders seeded state from a caller-owned store", async () => {
    const store = createStore();
    store.set(valueAtom, "Ada");
    const view = await renderWithProviders(<StateLabel />, { store });
    expect(view.getByText("Ada")).toBeOnTheScreen();
  });

  it("does not leak state from an earlier render into a new render", async () => {
    const first = await renderWithProviders(<StateLabel />);
    await act(() => first.store.set(valueAtom, "Ada"));
    await first.unmount();
    const second = await renderWithProviders(<StateLabel />);
    expect(second.getByText("signed out")).toBeOnTheScreen();
  });
});

describe("socket boundary", () => {
  it("delivers incoming payloads only to the matching event listeners", () => {
    const socket = createSocketMock();
    const received = jest.fn();
    const unrelated = jest.fn();
    socket.on("message", received).on("match", unrelated);
    socket.serverEmit("message", { text: "Hello" });
    expect(received).toHaveBeenCalledWith({ text: "Hello" });
    expect(unrelated).not.toHaveBeenCalled();
  });

  it("records outgoing messages without simulating a server response", () => {
    const socket = createSocketMock();
    const received = jest.fn();
    socket.on("message", received);
    socket.emit("message", { text: "Hello" });
    expect(socket.emit).toHaveBeenCalledWith("message", { text: "Hello" });
    expect(received).not.toHaveBeenCalled();
  });

  it("removes a specific listener while retaining other subscribers", () => {
    const socket = createSocketMock();
    const removed = jest.fn();
    const retained = jest.fn();
    socket.on("message", removed).on("message", retained);
    socket.off("message", removed);
    socket.serverEmit("message", "Hello");
    expect(removed).not.toHaveBeenCalled();
    expect(retained).toHaveBeenCalledWith("Hello");
  });

  it("stops delivery after disconnect", () => {
    const socket = createSocketMock();
    const received = jest.fn();
    socket.on("message", received);
    socket.disconnect();
    socket.serverEmit("message", "Hello");
    expect(received).not.toHaveBeenCalled();
  });
});
