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

const activeSockets = new Map();

// Screens share one connection per user until the last screen releases it.
export function acquireAuthenticatedSocket(userId) {
  if (!userId) return null;
  let entry = activeSockets.get(userId);
  if (!entry) {
    entry = { socket: createAuthenticatedSocket(), users: 0 };
    activeSockets.set(userId, entry);
  }
  entry.users += 1;
  return entry.socket;
}

export function releaseAuthenticatedSocket(userId, socket) {
  const entry = activeSockets.get(userId);
  // Ignore cleanup from an older connection.
  if (!entry || entry.socket !== socket) return;
  entry.users -= 1;
  if (entry.users === 0) {
    socket.disconnect();
    activeSockets.delete(userId);
  }
}
