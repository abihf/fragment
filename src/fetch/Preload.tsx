import { ReactElement } from "react";
import { withIsomirphicMarker } from "../isomorphic/IsomorphicMarker";
import { withCacheManager } from "./CacheProvider";
import { FetchOptions, IFetcher } from "./Fetcher";

type PreloadRequestObject<T> = {
  fetcher: IFetcher<any, T>;
  args: T;
};

type PreloadRequestArray<T> = [IFetcher<any, T>, T];

type PreloadRequest<T> = PreloadRequestObject<T> | PreloadRequestArray<T>;

type PreloadProps = {
  fetch: Array<PreloadRequest<any>>;
};

function isObject<T>(x: PreloadRequest<T>): x is PreloadRequestObject<T> {
  return typeof (x as PreloadRequestObject<T>).fetcher !== "undefined";
}

export const Preload = withIsomirphicMarker<PreloadProps>(
  withCacheManager(({ fetch, cacheManager, insideIsomorphic, children }) => {
    const opt: FetchOptions = {
      dump: insideIsomorphic,
    };
    fetch.forEach((item) => {
      if (isObject(item)) {
        item.fetcher.fetch(cacheManager, item.args, opt);
      } else {
        item[0].fetch(cacheManager, item["1"], opt);
      }
    });

    return (children as ReactElement<any>) || null;
  }),
);
