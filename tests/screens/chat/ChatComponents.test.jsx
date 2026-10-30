import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import Header from "../../../app/screens/ChatScreen/Header";
import MessageInputBox from "../../../app/screens/ChatScreen/MessageInputBox";
import MessagesList from "../../../app/screens/ChatScreen/MessagesList";

jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});

describe("Chat components", () => {
  it("renders the chat header and invokes its navigation and clear actions", async () => {
    const onBack = jest.fn();
    const onClear = jest.fn();
    await render(
      <Header fullName="Alex Friend" platform="ios" leftBtnAction={onBack} rightBtnAction={onClear} />
    );

    expect(screen.getByText("Alex Friend")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("arrow-back-ios-new"));
    await fireEvent.press(screen.getByText("delete"));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("sends a message and clears the input", async () => {
    const addNewMessage = jest.fn();
    await render(<MessageInputBox addNewMessage={addNewMessage} />);

    await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "Hello there");
    await fireEvent.press(screen.getByText("Send"));

    expect(addNewMessage).toHaveBeenCalledWith("Hello there");
    expect(screen.getByPlaceholderText("Message...").props.value).toBe("");
  });

  it("renders incoming and outgoing messages with an avatar for incoming messages", async () => {
    await render(
      <MessagesList
        fullName="Alex Friend"
        messagesHistory={[
          { from: "1", content: "Hi from Alex" },
          { from: "2", content: "Hi from me" },
        ]}
      />
    );

    expect(screen.getByText("Hi from Alex")).toBeOnTheScreen();
    expect(screen.getByText("Hi from me")).toBeOnTheScreen();
    expect(screen.getByText("AF")).toBeOnTheScreen();
  });

  it("sends successive drafts independently without reusing the previous message", async () => {
    const addNewMessage = jest.fn();
    await render(<MessageInputBox addNewMessage={addNewMessage} />);
    await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "First draft");
    await fireEvent.press(screen.getByText("Send"));
    await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "Second draft");
    await fireEvent.press(screen.getByText("Send"));

    expect(addNewMessage.mock.calls).toEqual([["First draft"], ["Second draft"]]);
    expect(screen.getByPlaceholderText("Message...").props.value).toBe("");
  });

  it("replaces displayed history and removes incoming avatars when the list is cleared", async () => {
    const view = await render(<MessagesList fullName="Alex Friend" messagesHistory={[{ from: "1", content: "Old reply" }]} />);
    expect(screen.getByText("Old reply")).toBeOnTheScreen();
    expect(screen.getByText("AF")).toBeOnTheScreen();

    await view.rerender(<MessagesList fullName="Alex Friend" messagesHistory={[]} />);

    expect(screen.queryByText("Old reply")).toBeNull();
    expect(screen.queryByText("AF")).toBeNull();
  });

});
