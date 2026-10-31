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

  it("leaves the server IP unset when the environment variable is absent", () => {
    delete process.env.EXPO_PUBLIC_IP;
    let config;
    jest.isolateModules(() => {
      config = require("../../constant");
    });

    expect(config.IP).toBeUndefined();
  });
});
