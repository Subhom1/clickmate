import { Auth } from "../../FirebaseConfig";

// Protected API calls and sockets use the current Firebase ID token.
export async function getIdToken() {
  const token = await Auth.currentUser?.getIdToken();
  if (!token) throw new Error("Please sign in again.");
  return token;
}

export async function authenticatedHeaders() {
  return { Authorization: `Bearer ${await getIdToken()}` };
}
