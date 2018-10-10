import React from "react";
import { render } from "react-testing-library";

import { IFetcher } from "./Fetcher";
import { Preload } from "./Preload";

describe("Preload Component", () => {
  it("should call all fetchers with its arguments", () => {
    const fetcher1: IFetcher<string, string> = {
      fetch: jest.fn(() => {
        return { loading: false, data: "ok" };
      }),
    };
    const fetcher2: IFetcher<number, boolean> = {
      fetch: jest.fn(() => {
        return { loading: true, promise: Promise.resolve(true) };
      }),
    };

    const app = (
      <Preload
        fetch={[
          { fetcher: fetcher1, args: "abc" },
          { fetcher: fetcher2, args: 123 },
        ]}
      />
    );

    render(app);

    expect(fetcher1.fetch).toBeCalledWith(
      expect.any(Object), // cache manager
      "abc", // argument
      expect.any(Object), // fetch option
    );
    expect(fetcher2.fetch).toBeCalledWith(
      expect.any(Object), // cache manager
      123, // argument
      expect.any(Object), // fetch option
    );
  });

  it("should return its children", () => {
    const fetcher: IFetcher<string, string> = {
      fetch() {
        return { loading: false, data: "Hello" };
      },
    };

    const app = (
      <Preload fetch={[{ fetcher, args: "Fragment" }]}>Success</Preload>
    );

    const { container } = render(app);
    expect(container.innerHTML).toBe("Success");
  });
});
