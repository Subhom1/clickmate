import React from "react";
import { createStore, Provider } from "jotai";
import { render } from "@testing-library/react-native";

// Each render owns its state. Pass a store explicitly to test shared flows.
export async function renderWithProviders(ui, { store = createStore(), ...options } = {}) {
  const result = await render(ui, {
    ...options,
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
  return { ...result, store };
}
