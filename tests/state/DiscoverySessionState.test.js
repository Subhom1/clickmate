import { createStore } from "jotai";
import { exploreState } from "../../app/state/atoms/ExploreState";
import { matchState } from "../../app/state/atoms/MatchState";
import { userState } from "../../app/state/atoms/UserState";

it("replaces the category cache without changing another session", () => {
  const current = createStore();
  const other = createStore();
  expect(current.get(exploreState)).toBeNull();
  current.set(exploreState, [{ category: "old" }]);
  current.set(exploreState, [{ category: "new" }]);
  expect(current.get(exploreState)).toEqual([{ category: "new" }]);
  expect(other.get(exploreState)).toBeNull();
});

it("clears a previous match before another search without discarding the profile", () => {
  const store = createStore();
  const user = { fullname: "Test User", email: "user@example.test" };
  expect(store.get(matchState)).toBeNull();
  store.set(userState, user);
  store.set(matchState, { email: "match@example.test" });
  store.set(matchState, null);
  expect(store.get(matchState)).toBeNull();
  expect(store.get(userState)).toEqual(user);
});

it("updates the profile through an atom updater and resets only its session", () => {
  const current = createStore();
  const other = createStore();
  expect(current.get(userState)).toBeNull();
  current.set(userState, { fullname: "Original", email: "user@example.test" });
  other.set(userState, { fullname: "Other" });
  current.set(userState, previous => ({ ...previous, fullname: "Updated" }));
  expect(current.get(userState)).toEqual({ fullname: "Updated", email: "user@example.test" });
  current.set(userState, null);
  expect(current.get(userState)).toBeNull();
  expect(other.get(userState)).toEqual({ fullname: "Other" });
});
