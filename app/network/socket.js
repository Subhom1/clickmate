import io from "socket.io-client";
import { API_BASE_URL } from "../../constant";
import { getIdToken } from "./auth";

// Socket.IO asks for auth again on reconnect, so use a fresh token each time.
export function createAuthenticatedSocket() {
  return io(API_BASE_URL, {
    reconnectionAttempts: 5,
    auth: async (sendAuth) => {
      try {
        sendAuth({ token: await getIdToken() });
      } catch {
        sendAuth({});
      }
    },
  });
}
