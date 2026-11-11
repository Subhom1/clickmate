import Constants from "expo-constants";

const expoHost = Constants.expoConfig?.hostUri?.match(
  /^((?:\d{1,3}\.){3}\d{1,3}|localhost|[^:]+\.local)(?::\d+)?$/,
)?.[1];

export const IP = expoHost ?? process.env.EXPO_PUBLIC_IP;
