import { registerRootComponent } from "expo";
import App from "../../App";
import "../../index";

jest.mock("expo", () => ({ registerRootComponent: jest.fn() }));
jest.mock("../../App", () => ({ __esModule: true, default: () => null }));

describe("Expo entry point", () => {
  it("registers the root application with Expo", () => {
    expect(registerRootComponent).toHaveBeenCalledWith(App);
  });
});
