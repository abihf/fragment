import { createFetcher } from "./SimpleFetcher";

describe("createFetcher", () => {
  it("should return a fetcher object", () => {
    const fetcher = createFetcher({
      fetch: () => Promise.resolve(),
      name: "dummy",
    });
    expect(fetcher).toMatchObject({
      fetch: expect.any(Function),
    });
  });
});
