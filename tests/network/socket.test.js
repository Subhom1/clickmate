import io from "socket.io-client";
import { acquireAuthenticatedSocket, releaseAuthenticatedSocket } from "../../app/network/socket";

jest.mock("socket.io-client", () => jest.fn());
jest.mock("../../constant", () => ({ API_BASE_URL: "https://api.clickmate.test" }));
jest.mock("../../app/network/auth", () => ({ getIdToken: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  io.mockImplementation(() => ({ disconnect: jest.fn() }));
});

test("one user shares one socket until the last screen releases it", () => {
  const homeSocket = acquireAuthenticatedSocket("user-1");
  const peopleSocket = acquireAuthenticatedSocket("user-1");
  expect(homeSocket).toBe(peopleSocket);
  expect(io).toHaveBeenCalledTimes(1);

  releaseAuthenticatedSocket("user-1", homeSocket);
  expect(homeSocket.disconnect).not.toHaveBeenCalled();
  releaseAuthenticatedSocket("user-1", peopleSocket);
  expect(homeSocket.disconnect).toHaveBeenCalledTimes(1);

  const nextSocket = acquireAuthenticatedSocket("user-1");
  expect(nextSocket).not.toBe(homeSocket);
  expect(io).toHaveBeenCalledTimes(2);
  releaseAuthenticatedSocket("user-1", nextSocket);
});
