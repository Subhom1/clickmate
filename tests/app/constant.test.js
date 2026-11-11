jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: {} },
}));

describe("public environment configuration", () => {
  const previousIp = process.env.EXPO_PUBLIC_IP;
  const previousApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    if (previousIp === undefined) {
      delete process.env.EXPO_PUBLIC_IP;
    } else {
      process.env.EXPO_PUBLIC_IP = previousIp;
    }
    if (previousApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_BASE_URL;
    else process.env.EXPO_PUBLIC_API_BASE_URL = previousApiUrl;
    jest.resetModules();
  });

  it("reads the public server IP from the Expo environment", () => {
    process.env.EXPO_PUBLIC_IP = "192.0.2.5";
    let config;
    jest.isolateModules(() => {
      config = require("../../constant");
    });

    expect(config.IP).toBe("192.0.2.5");
  });

  it("uses the local Expo server host when it is available", () => {
    process.env.EXPO_PUBLIC_IP = "192.0.2.5";
    let config;
    jest.isolateModules(() => {
      require("expo-constants").default.expoConfig = { hostUri: "172.20.10.3:8081" };
      config = require("../../constant");
    });

    expect(config.IP).toBe("172.20.10.3");
  });

  it("uses the environment fallback for a tunnel host", () => {
    process.env.EXPO_PUBLIC_IP = "192.0.2.5";
    let config;
    jest.isolateModules(() => {
      require("expo-constants").default.expoConfig = { hostUri: "example.exp.direct:80" };
      config = require("../../constant");
    });

    expect(config.IP).toBe("192.0.2.5");
  });

  it("leaves the server IP unset when the environment variable is absent", () => {
    delete process.env.EXPO_PUBLIC_IP;
    let config;
    jest.isolateModules(() => {
      config = require("../../constant");
    });

    expect(config.IP).toBeUndefined();
  });

  it("uses Metro's local host for the development API when the configured IP is stale", () => {
    process.env.EXPO_PUBLIC_IP = "192.0.2.5";
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    let config;
    jest.isolateModules(() => {
      require("expo-constants").default.expoConfig = { hostUri: "172.20.10.3:8081" };
      config = require("../../constant");
    });
    expect(config.API_BASE_URL).toBe("http://172.20.10.3:5051");
  });

  it("uses the configured HTTPS API origin without a trailing slash", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.example.com/";
    let config;
    jest.isolateModules(() => { config = require("../../constant"); });
    expect(config.API_BASE_URL).toBe("https://api.example.com");
  });
});
