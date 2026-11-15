import io from "socket.io-client";
import { Auth } from "../../FirebaseConfig";
import { authenticatedHeaders } from "../../app/network/auth";
import { createAuthenticatedSocket } from "../../app/network/socket";

jest.mock("socket.io-client", () => jest.fn(() => ({ connected: false })));
jest.mock("../../constant", () => ({ API_BASE_URL: "https://api.clickmate.test" }));
jest.mock("../../FirebaseConfig", () => ({
  Auth: { currentUser: { getIdToken: jest.fn() } },
}));

beforeEach(() => {
  jest.clearAllMocks();
  Auth.currentUser.getIdToken.mockResolvedValue("token-1");
});

test("sends a fresh Firebase token in every Socket.IO handshake", async () => {
  createAuthenticatedSocket();
  expect(io).toHaveBeenCalledWith("https://api.clickmate.test", {
    reconnectionAttempts: 5,
    auth: expect.any(Function),
  });
  const authorize = io.mock.calls[0][1].auth;
  const first = jest.fn();
  await authorize(first);
  expect(first).toHaveBeenCalledWith({ token: "token-1" });

  Auth.currentUser.getIdToken.mockResolvedValue("token-2");
  const reconnect = jest.fn();
  await authorize(reconnect);
  expect(reconnect).toHaveBeenCalledWith({ token: "token-2" });
});

test("protected requests use the current token", async () => {
  await expect(authenticatedHeaders()).resolves.toEqual({
    Authorization: "Bearer token-1",
  });
});

test("missing credentials do not send a fake token", async () => {
  Auth.currentUser.getIdToken.mockResolvedValue(null);
  await expect(authenticatedHeaders()).rejects.toThrow("Please sign in again.");
  createAuthenticatedSocket();
  const authorize = io.mock.calls[0][1].auth;
  const sendAuth = jest.fn();
  await authorize(sendAuth);
  expect(sendAuth).toHaveBeenCalledWith({});
});
