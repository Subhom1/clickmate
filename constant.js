import Constants from "expo-constants";

// Prefer Metro's local host over a stale LAN address. Tunnel hosts are not
// usable for the local API, so those fall back to the configured LAN IP.
const expoHost = Constants.expoConfig?.hostUri?.match(
  /^((?:\d{1,3}\.){3}\d{1,3}|localhost|[^:]+\.local)(?::\d+)?$/,
)?.[1];

export const IP = expoHost ?? process.env.EXPO_PUBLIC_IP;
const configuredApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
export const API_BASE_URL = configuredApiUrl && (__DEV__ || configuredApiUrl.startsWith("https://"))
  ? configuredApiUrl.replace(/\/$/, "")
  : (__DEV__ && IP ? `http://${IP}:5051` : "");
