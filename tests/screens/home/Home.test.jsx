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
const initialTimezoneSearchFlag = process.env.EXPO_PUBLIC_TIMEZONE_SEARCH_ENABLED;
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
  delete process.env.EXPO_PUBLIC_TIMEZONE_SEARCH_ENABLED;
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockSocket = createSocketMock();
  mockSocket.connected = true;
});
afterEach(() => {
  if (initialTimezoneSearchFlag === undefined) delete process.env.EXPO_PUBLIC_TIMEZONE_SEARCH_ENABLED;
  else process.env.EXPO_PUBLIC_TIMEZONE_SEARCH_ENABLED = initialTimezoneSearchFlag;
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const renderHome = async ({ user = { _id: "me-1" }, connected = true } = {}) => {
  mockSocket.connected = connected;
  const store = createStore();
  store.set(userState, user);
  const view = await render(
    <Provider store={store}>
      <Home route={{ params: { platform: "ios" } }} />
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
    expect(mockSocket.off).toHaveBeenCalledWith("search_update");
    expect(mockSocket.off).toHaveBeenCalledWith("error");
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});


it("uses a suggested tag as the submitted search query", async () => {
  await renderHome();
  await fireEvent.press(screen.getByText("# weekend escape"));
  expect(screen.getByPlaceholderText("Type your current mood")).toHaveDisplayValue("weekend escape");
  await fireEvent.press(screen.getByText("Search"));
  expect(mockSocket.emit).toHaveBeenCalledWith("submit_keyword", {
    userId: "me-1", query: "weekend escape",
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

it("submits a selected local date and time with the device zone and selected-date offset", async () => {
  process.env.EXPO_PUBLIC_TIMEZONE_SEARCH_ENABLED = "true";
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2027-01-15T09:00:00Z"));
  const selected = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`;
  const time = `${pad(selected.getHours())}:${pad(Math.floor(selected.getMinutes() / 5) * 5)}`;
  const { resolveLocalSchedule } = require("../../../app/search/localSchedule");
  const zone = resolveLocalSchedule(date, time);
  expect(zone.error).toBeUndefined();
  await renderHome();
  await fireEvent.press(screen.getByLabelText("Choose a date"));
  await fireEvent.press(screen.getByText("Apply date"));
  await fireEvent.press(screen.getByLabelText("Choose a time"));
  await fireEvent.press(screen.getByText("Apply time"));
  await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
  await fireEvent.press(screen.getByText("Search"));
  expect(mockSocket.emit).toHaveBeenCalledWith("submit_keyword", {
    userId: "me-1", query: "coffee", date, time, ...zone,
  });
  expect(screen.getByText(`Time zone: ${zone.timeZone}`)).toBeOnTheScreen();
});

it("keeps a date-only search compatible with older clients", async () => {
  process.env.EXPO_PUBLIC_TIMEZONE_SEARCH_ENABLED = "true";
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2027-01-15T09:00:00Z"));
  const selected = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`;
  await renderHome();
  await fireEvent.press(screen.getByLabelText("Choose a date"));
  await fireEvent.press(screen.getByText("Apply date"));
  await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
  await fireEvent.press(screen.getByText("Search"));
  expect(mockSocket.emit).toHaveBeenCalledWith("submit_keyword", { userId: "me-1", query: "coffee", date });
});

it.each([
  ["nonexistent", "This time does not exist because clocks change. Please choose another time."],
  ["ambiguous", "This time occurs twice because clocks change. Please choose another time."],
])("prevents submission for a %s local time", async (error, message) => {
  process.env.EXPO_PUBLIC_TIMEZONE_SEARCH_ENABLED = "true";
  const helper = require("../../../app/search/localSchedule");
  jest.spyOn(helper, "resolveLocalSchedule").mockReturnValue({ error });
  await renderHome();
  await fireEvent.press(screen.getByLabelText("Choose a date"));
  await fireEvent.press(screen.getByText("Apply date"));
  await fireEvent.press(screen.getByLabelText("Choose a time"));
  await fireEvent.press(screen.getByText("Apply time"));
  await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
  await fireEvent.press(screen.getByText("Search"));
  expect(Alert.alert).toHaveBeenCalledWith("Choose another time", message);
  expect(mockSocket.emit).not.toHaveBeenCalled();
});

it.each([undefined, "false", "TRUE"])("hides schedule controls when the timezone rollout flag is %s", async (flag) => {
  if (flag !== undefined) process.env.EXPO_PUBLIC_TIMEZONE_SEARCH_ENABLED = flag;
  await renderHome();
  expect(screen.queryByLabelText("Choose a date")).toBeNull();
  expect(screen.queryByLabelText("Choose a time")).toBeNull();
  expect(screen.queryByText(/Time zone:/)).toBeNull();
});

it("defensively blocks a complete schedule if the rollout gate is disabled before submission", async () => {
  process.env.EXPO_PUBLIC_TIMEZONE_SEARCH_ENABLED = "true";
  await renderHome();
  await fireEvent.press(screen.getByLabelText("Choose a date"));
  await fireEvent.press(screen.getByText("Apply date"));
  await fireEvent.press(screen.getByLabelText("Choose a time"));
  await fireEvent.press(screen.getByText("Apply time"));
  delete process.env.EXPO_PUBLIC_TIMEZONE_SEARCH_ENABLED;
  await fireEvent.changeText(screen.getByPlaceholderText("Type your current mood"), "coffee");
  await fireEvent.press(screen.getByText("Search"));
  expect(Alert.alert).toHaveBeenCalledWith("Scheduled search unavailable", "Date and time search is not available yet. Clear one or both fields to continue.");
  expect(mockSocket.emit).not.toHaveBeenCalled();
});
