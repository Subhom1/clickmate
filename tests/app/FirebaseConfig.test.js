// The virtual secret module prevents resolution or execution of local credentials.
jest.mock("../../FirebaseSecret", () => ({
  firebaseSecret: { apiKey: "fake-test-key", projectId: "test-only-project" },
}), { virtual: true });
jest.mock("firebase/app", () => ({ initializeApp: jest.fn(() => ({ name: "test-app" })) }));
jest.mock("firebase/auth", () => ({
  initializeAuth: jest.fn(() => ({ name: "test-auth" })),
  getReactNativePersistence: jest.fn(() => ({ type: "test-persistence" })),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true, default: { getItem: jest.fn(), setItem: jest.fn() },
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

it("exports the Firebase app initialized with the supplied configuration", () => {
  const { FIREBASE_APP } = require("../../FirebaseConfig");
  const { initializeApp } = require("firebase/app");
  const { firebaseSecret } = require("../../FirebaseSecret");
  expect(initializeApp).toHaveBeenCalledTimes(1);
  expect(initializeApp).toHaveBeenCalledWith(firebaseSecret);
  expect(FIREBASE_APP).toBe(initializeApp.mock.results[0].value);
});

it("exports auth for that app with persistent React Native storage", () => {
  const { Auth, FIREBASE_APP } = require("../../FirebaseConfig");
  const { initializeAuth, getReactNativePersistence } = require("firebase/auth");
  const storage = require("@react-native-async-storage/async-storage").default;
  expect(getReactNativePersistence).toHaveBeenCalledWith(storage);
  expect(initializeAuth).toHaveBeenCalledTimes(1);
  expect(initializeAuth).toHaveBeenCalledWith(FIREBASE_APP, {
    persistence: getReactNativePersistence.mock.results[0].value,
  });
  expect(Auth).toBe(initializeAuth.mock.results[0].value);
});

it("shares one initialized app and auth across repeated consumer imports", () => {
  const first = require("../../FirebaseConfig");
  const second = require("../../FirebaseConfig");
  expect(second.Auth).toBe(first.Auth);
  expect(second.FIREBASE_APP).toBe(first.FIREBASE_APP);
  expect(require("firebase/app").initializeApp).toHaveBeenCalledTimes(1);
  expect(require("firebase/auth").initializeAuth).toHaveBeenCalledTimes(1);
});
