import { extractModuleDefault } from "./module";
describe("extractModuleDefault", () => {
  it("should return default export", () => {
    const module = { default: "X" };
    expect(extractModuleDefault(module)).toBe("X");
  });

  it("should return bare export", () => {
    const module = "X";
    expect(extractModuleDefault(module)).toBe("X");
  });
});
