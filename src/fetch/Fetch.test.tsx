import React from "react";
import { render } from "react-testing-library";

import { ICacheManager } from "./CacheManager";
import { CacheProvider } from "./CacheProvider";
import { useFetcher } from "./Fetch";
import { IFetcher } from "./Fetcher";

const dummyFetcher: IFetcher<string, string> = {
  fetch: () => Promise.resolve("x"),
  hashKey: (x) => x,
  name: "dummy",
};

describe("useFetcher", () => {
  it("should ll", async () => {
    const promise = Promise.resolve("result");
    let loaded = false;

    const cache: ICacheManager = {
      enqueue: jest.fn(() => {
        loaded = true;
        return promise;
      }),
      get: jest.fn(() => (loaded ? { value: 123 } : undefined)),
    };

    function App() {
      const res = useFetcher(dummyFetcher, "x");
      if (res.loading) {
        return <>loading</>;
      } else {
        return <>{res.data}</>;
      }
    }
    const root = (
      <CacheProvider value={cache}>
        <App />
      </CacheProvider>
    );

    let rendered = render(root);
    expect(rendered.container.innerHTML).toBe("loading");

    await promise;

    rendered = render(root);
    expect(rendered.container.innerHTML).toBe("123");
  });
});
