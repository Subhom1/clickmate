import { createStore } from "jotai";
import { chatState } from "../../app/state/atoms/ChatState";

it("keeps chat selection isolated between sessions and allows clearing it", () => {
  const firstSession = createStore();
  const secondSession = createStore();
  expect(firstSession.get(chatState)).toBeNull();
  firstSession.set(chatState, "selected-chat");
  expect(firstSession.get(chatState)).toBe("selected-chat");
  expect(secondSession.get(chatState)).toBeNull();
  firstSession.set(chatState, null);
  expect(firstSession.get(chatState)).toBeNull();
});
