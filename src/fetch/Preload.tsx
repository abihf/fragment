import { ReactElement, ReactNode, useContext } from "react";
import { CacheContext } from "./CacheProvider";
import { IFetcher } from "./Fetcher";

type PreloadRequestObject<T> = {
  fetcher: IFetcher<any, T>;
  args: T;
};

type PreloadRequestArray<T> = [IFetcher<any, T>, T];

type PreloadRequest<T> = PreloadRequestObject<T> | PreloadRequestArray<T>;

type PreloadProps = {
  fetch: Array<PreloadRequest<any>>;
  children?: ReactNode | (() => ReactNode);
};

function isObject<T>(x: PreloadRequest<T>): x is PreloadRequestObject<T> {
  return typeof (x as PreloadRequestObject<T>).fetcher !== "undefined";
}

function isFunction<T>(x: T | (() => T)): x is (() => T) {
  return typeof x === "function";
}

export function usePreloader(fetch: ReadonlyArray<PreloadRequest<any>>): void {
  const cache = useContext(CacheContext);
  fetch.forEach((item) => {
    let fetcher: IFetcher<any, any>;
    let args: any;
    if (isObject(item)) {
      fetcher = item.fetcher;
      args = item.args;
    } else {
      fetcher = item[0];
      args = item[1];
    }
    cache.enqueue(fetcher.name, fetcher.hashKey(args), args, fetcher.fetch);
  });
}

export function Preload({ fetch, children }: PreloadProps) {
  usePreloader(fetch);

  if (isFunction(children)) {
    return children() as ReactElement<any>;
  } else {
    return (children as ReactElement<any>) || null;
  }
}
