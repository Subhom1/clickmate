import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert, Keyboard, Text } from "react-native";
import { Provider, createStore, useAtomValue } from "jotai";
import Home from "../../../app/screens/Home";
import { userState } from "../../../app/state/atoms/UserState";
import { matchState } from "../../../app/state/atoms/MatchState";
import { createSocketMock } from "../../mocks/socket";

const mockNavigation = { navigate: jest.fn() };
let mockSocket;
jest.mock("@react-navigation/native", () => ({ useNavigation: () => mockNavigation }));
jest.mock("socket.io-client", () => jest.fn(() => mockSocket));
jest.mock("../../../FirebaseConfig", () => ({ Auth: { currentUser: { getIdToken: jest.fn().mockResolvedValue("test-token") } } }));
jest.mock("../../../constant", () => ({ API_BASE_URL: "http://localhost:5051" }));
jest.mock("../../../app/components/ToggleSwitch", () => () => null);
jest.mock("@expo/vector-icons/FontAwesome5", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});
jest.mock("@expo/vector-icons/Feather", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});

function MatchProbe() {
  const match = useAtomValue(matchState);
  return <Text>{match?.user?.fullname ?? "no match"}</Text>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockSocket = createSocketMock();
  mockSocket.connected = true;
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const renderHome = async ({ user = { _id: "me-1" }, connected = true, platform = "ios" } = {}) => {
  mockSocket.connected = connected;
  const store = createStore();
  store.set(userState, user);
  const view = await render(
    <Provider store={store}>
      <Home route={{ params: { platform } }} />
      <MatchProbe />
    </Provider>
  );
  return { ...view, store };
};

describe("Home search", () => {
  it("requires a query and a loaded user before searching", async () => {
    await renderHome({ user: null });
    await fireEvent.press(screen.getByText("Search"));
    expect(Alert.alert).toHaveBeenCalledWith("Search required", "Please enter a search query");

    await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
    await fireEvent.press(screen.getByText("Search"));
    expect(Alert.alert).toHaveBeenCalledWith("Please wait", "Your profile is still loading");
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it("submits a trimmed query and lets the user cancel", async () => {
    await renderHome();
    await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "  coffee meetup  ");
    await fireEvent.press(screen.getByText("Search"));

    expect(mockSocket.emit).toHaveBeenCalledWith("submit_keyword", {
      userId: "me-1",
      query: "coffee meetup",
    });
    expect(screen.getByText("Searching . . .")).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Cancel"));
    expect(mockSocket.emit).toHaveBeenCalledWith("cancel_search", { userId: "me-1" });
    expect(screen.getByText("Search")).toBeOnTheScreen();
  });

  it("submits from a focused input and dismisses the keyboard", async () => {
    const dismiss = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    await renderHome();

    const input = screen.getByPlaceholderText("Type your current mood");
    await fireEvent(input, "focus");
    await fireEvent.changeText(input, "coffee meetup");
    await fireEvent.press(screen.getByText("Search"));

    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(mockSocket.emit).toHaveBeenCalledWith("submit_keyword", {
      userId: "me-1",
      query: "coffee meetup",
    });
  });

  it("dismisses the keyboard when the page is tapped outside an input or dragged", async () => {
    await renderHome();
    const scroll = screen.getByTestId("keyboard-dismiss-scroll");
    expect(scroll.props.keyboardShouldPersistTaps).toBe("handled");
    expect(scroll.props.keyboardDismissMode).toBe("on-drag");
  });

  it("leaves scroll room for the search action above the overlaid tab bar", async () => {
    await renderHome();
    const scroll = screen.getByTestId("keyboard-dismiss-scroll");
    expect(scroll.props.style).toEqual({ flex: 1 });
    expect(scroll.props.contentContainerStyle.paddingBottom).toBeGreaterThan(90);
  });

  it("reports unavailable socket connections", async () => {
    await renderHome({ connected: false });
    await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
    await fireEvent.press(screen.getByText("Search"));

    expect(Alert.alert).toHaveBeenCalledWith("Connection unavailable", "Please try again in a moment");
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it("opens the result screen when a match arrives", async () => {
    const { store } = await renderHome();
    await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
    await fireEvent.press(screen.getByText("Search"));
    const match = { user: { _id: "friend-1", fullname: "Alex Friend" } };
    await act(async () => mockSocket.serverEmit("search_update", { matches: match }));

    expect(store.get(matchState)).toEqual(match);
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Result");
  });

  it("shows no-result and server error feedback, then cleans up the socket", async () => {
    const view = await renderHome();
    await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
    await fireEvent.press(screen.getByText("Search"));
    await act(async () => mockSocket.serverEmit("search_update", { matches: null }));
    expect(screen.getByText(/No Users found/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Search"));
    await act(async () => mockSocket.serverEmit("error", { message: "try later" }));
    expect(Alert.alert).toHaveBeenCalledWith("Error", "try later");
    expect(screen.getByText("Search")).toBeOnTheScreen();

    await act(async () => view.unmount());
    expect(mockSocket.off).toHaveBeenCalledWith("search_update", expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});


it("uses a suggested tag as the submitted search query", async () => {
  await renderHome();
  await fireEvent.press(screen.getByText("# city tour"));
  expect(screen.getByPlaceholderText("Type your current mood")).toHaveDisplayValue("city tour");
  await fireEvent.press(screen.getByText("Search"));
  expect(mockSocket.emit).toHaveBeenCalledWith("submit_keyword", {
    userId: "me-1", query: "city tour",
  });
});

it("clears a stale match for an empty result and expires the no-result feedback after ten seconds", async () => {
  jest.useFakeTimers();
  const { store } = await renderHome();
  await act(async () => store.set(matchState, { user: { _id: "old-1", fullname: "Old Friend" } }));
  await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
  await fireEvent.press(screen.getByText("Search"));
  await act(async () => mockSocket.serverEmit("search_update", { matches: {} }));

  expect(store.get(matchState)).toBeNull();
  expect(mockNavigation.navigate).not.toHaveBeenCalled();
  expect(screen.getByText("Search")).toBeOnTheScreen();
  await act(async () => jest.advanceTimersByTime(9999));
  expect(screen.getByText(/No Users found/)).toBeOnTheScreen();
  await act(async () => jest.advanceTimersByTime(1));
  expect(screen.queryByText(/No Users found/)).toBeNull();
});

it("includes selected date and time as separate search parameters", async () => {
  await renderHome();
  await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "  coffee meetup  ");

  await fireEvent.press(screen.getByLabelText("Choose a date"));
  await fireEvent.press(screen.getByLabelText("Next month"));
  const nextMonth = new Date();
  nextMonth.setDate(1);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  await fireEvent.press(screen.getByLabelText(`18 ${nextMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`));
  await fireEvent.press(screen.getByText("Apply date"));

  await fireEvent.press(screen.getByLabelText("Choose a time"));
  await fireEvent.press(screen.getByLabelText("9 o'clock"));
  await fireEvent.press(screen.getByLabelText("30 minutes"));
  await fireEvent.press(screen.getByLabelText("PM"));
  await fireEvent.press(screen.getByText("Apply time"));
  await fireEvent.press(screen.getByText("Search"));

  const date = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-18`;
  expect(mockSocket.emit).toHaveBeenCalledWith("submit_keyword", {
    userId: "me-1",
    query: "coffee meetup",
    date,
    time: "21:30",
  });
});

it("lets the user clear a selected schedule value", async () => {
  await renderHome();
  await fireEvent.press(screen.getByLabelText("Choose a date"));
  await fireEvent.press(screen.getByText("Apply date"));
  expect(screen.queryByText("Choose a date")).toBeNull();

  await fireEvent.press(screen.getByLabelText("Choose a date"));
  await fireEvent.press(screen.getByText("Clear"));
  expect(screen.getByText("Choose a date")).toBeOnTheScreen();
});
