import React from "react";
import { Alert } from "react-native";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Provider } from "jotai";
import Login from "../../../app/screens/Login";
import Signup from "../../../app/screens/SignUp";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import axios from "axios";

const mockNavigate = jest.fn();

jest.mock("expo-router/react-navigation", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { platform: "ios" } }),
}));

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock("../../../FirebaseConfig", () => ({ Auth: {} }));
jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("@expo/vector-icons/Octicons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name }) => React.createElement(Text, null, name);
});
jest.mock("expo-font", () => ({ useFonts: () => [true] }));
jest.mock("expo-web-browser", () => ({}));

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  global.alert = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

const renderSignup = async () =>
  await render(
    <Provider>
      <Signup route={{ params: { platform: "ios" } }} />
    </Provider>
  );

describe("Login", () => {
  it("shows required field messages without attempting sign in", async () => {
    await render(<Login />);
    await fireEvent.press(screen.getByText("Login"));

    expect(screen.getByText("*email is required")).toBeTruthy();
    expect(screen.getByText("*password is required")).toBeTruthy();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address", async () => {
    await render(<Login />);
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "no-at-sign");
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "secret");
    await fireEvent.press(screen.getByText("Login"));

    expect(screen.getByText("*email is invalid")).toBeTruthy();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("signs in valid credentials and clears the loading state", async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: "u-1" } });
    await render(<Login />);
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "user@example.com");
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "secret");
    await fireEvent.press(screen.getByText("Login"));

    await waitFor(() =>
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, "user@example.com", "secret")
    );
    await waitFor(() => expect(screen.getByText("Login")).toBeTruthy());
  });

  it("keeps the form hidden while sign in is pending, then restores it", async () => {
    let resolveSignIn;
    signInWithEmailAndPassword.mockReturnValue(new Promise((resolve) => { resolveSignIn = resolve; }));
    await render(<Login />);
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "user@example.com");
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "secret");
    await fireEvent.press(screen.getByText("Login"));

    expect(screen.queryByPlaceholderText("Enter your password")).toBeNull();
    await act(async () => { resolveSignIn({ user: { uid: "u-1" } }); });
    expect(screen.getByPlaceholderText("Enter your email")).toHaveProp("value", "user@example.com");
  });

  it("reports a rejected sign in and lets the user retry successfully", async () => {
    const error = new Error("Invalid credentials");
    signInWithEmailAndPassword.mockRejectedValueOnce(error).mockResolvedValueOnce({ user: { uid: "u-1" } });
    await render(<Login />);
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "user@example.com");
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "secret");
    await fireEvent.press(screen.getByText("Login"));

    await waitFor(() => expect(global.alert).toHaveBeenCalledWith("Sign In failed: Invalid credentials"));
    expect(screen.getByPlaceholderText("Enter your password")).toHaveProp("value", "secret");
    await fireEvent.press(screen.getByText("Login"));
    await waitFor(() => expect(screen.getByText("Login")).toBeOnTheScreen());
    expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(2);
    expect(global.alert).toHaveBeenCalledTimes(1);
  });

  it("navigates to sign up", async () => {
    await render(<Login />);
    await fireEvent.press(screen.getByText("Sign up"));

    expect(mockNavigate).toHaveBeenCalledWith("SignUp");
  });
});

describe("Sign up", () => {
  const fillSignup = async ({ name = "Casey User", email = "casey@example.com", password = "secret1", confirmation = password } = {}) => {
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your full name"), name);
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), email);
    await fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), password);
    await fireEvent.changeText(screen.getByPlaceholderText("Confirm password"), confirmation);
  };

  it("shows required fields and does not create an account", async () => {
    await renderSignup();
    await fireEvent.press(screen.getByText("Sign Up"));

    expect(screen.getByText("*name is required")).toBeTruthy();
    expect(screen.getByText("*email is required")).toBeTruthy();
    expect(screen.getByText("*password is required")).toBeTruthy();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address", async () => {
    await renderSignup();
    await fillSignup({ email: "not-an-email" });
    await fireEvent.press(screen.getByText("Sign Up"));

    expect(screen.getByText("*email is invalid")).toBeTruthy();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("shows an error when the password confirmation does not match", async () => {
    await renderSignup();
    await fillSignup({ password: "secret1", confirmation: "other1" });
    await fireEvent.press(screen.getByText("Sign Up"));

    expect(screen.getByText("*password does not match")).toBeTruthy();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than six characters", async () => {
    await renderSignup();
    await fillSignup({ password: "123", confirmation: "123" });
    await fireEvent.press(screen.getByText("Sign Up"));

    expect(screen.getByText("*password is too short")).toBeTruthy();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("blocks profile registration until account creation completes", async () => {
    let resolveSignup;
    createUserWithEmailAndPassword.mockReturnValue(new Promise((resolve) => { resolveSignup = resolve; }));
    axios.post.mockResolvedValue({ data: { data: { name: "Casey User" } } });
    await renderSignup();
    await fillSignup();
    await fireEvent.press(screen.getByText("Sign Up"));

    expect(screen.queryByText("Sign Up")).toBeNull();
    expect(axios.post).not.toHaveBeenCalled();
    expect(global.alert).not.toHaveBeenCalled();
    await act(async () => { resolveSignup({ user: { uid: "u-2" } }); });
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Sign Up")).toBeOnTheScreen();
  });

  it("reports account creation failure without registering a profile", async () => {
    createUserWithEmailAndPassword.mockRejectedValue(new Error("Email already in use"));
    await renderSignup();
    await fillSignup();
    await fireEvent.press(screen.getByText("Sign Up"));

    await waitFor(() => expect(global.alert).toHaveBeenCalledWith("Registration failed: Email already in use"));
    expect(axios.post).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("Enter your full name")).toHaveProp("value", "Casey User");
    expect(screen.getByText("Sign Up")).toBeOnTheScreen();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("creates an account, registers the profile, and navigates back to login", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "u-2" } });
    axios.post.mockResolvedValue({ data: { data: { name: "Casey User" } } });
    await renderSignup();
    await fillSignup();
    await fireEvent.press(screen.getByText("Sign Up"));

    await waitFor(() =>
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({}, "casey@example.com", "secret1")
    );
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/register$/), {
        name: "Casey User",
        email: "casey@example.com",
      })
    );
    expect(global.alert).toHaveBeenCalledWith("Registration Successful: Check your email!");
    await fireEvent.press(screen.getByText("Login"));
    expect(mockNavigate).toHaveBeenCalledWith("Login");
  });
});
