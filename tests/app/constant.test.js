jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: {} },
}));

describe("public environment configuration", () => {
  const previousIp = process.env.EXPO_PUBLIC_IP;

  afterEach(() => {
    if (previousIp === undefined) {
      delete process.env.EXPO_PUBLIC_IP;
    } else {
      process.env.EXPO_PUBLIC_IP = previousIp;
    }
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
});
