import React, { ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { IsomorphicMarkerContext } from "../isomorphic/IsomorphicMarker";
import { ICacheManager } from "./CacheManager";
import { CacheContext } from "./CacheProvider";
import { FetchResult, IFetcher } from "./Fetcher";
import { IServerCacheManager } from "./ServerCacheManager";

export type FetchProps<K, V> = {
  fetcher: IFetcher<K, V>;
  args: K;
  noThrows?: boolean;
  fallback?: ReactNode;
  children: (value: FetchResult<V>) => React.ReactNode;
};

export function Fetch<K, V>({ fetcher, args, fallback, noThrows, children }: FetchProps<K, V>) {
  const result = useFetcher(fetcher, args);

  if (!result.loading && result.error && !noThrows) {
    throw result.error;
  }

  if (fallback && result.loading) {
    return fallback;
  }

  return children(result);
}

function isServerCache(cache: ICacheManager): cache is IServerCacheManager {
  return typeof (cache as IServerCacheManager).markAsExported === "function";
}

export function useFetcher<K, V>(fetcher: IFetcher<K, V>, args: K): FetchResult<V> {
  const cache = useContext(CacheContext);
  const insideIsomorphic = useContext(IsomorphicMarkerContext);

  const cacheKey = useMemo(() => fetcher.hashKey(args), [args]);
  const [loading, setLoading] = useState(false);

  const result = useMemo<FetchResult<V>>(
    () => {
      const cached = cache.get<V>(fetcher.name, cacheKey);
      if (cached) {
        if (insideIsomorphic && isServerCache(cache)) {
          cache.markAsExported(fetcher.name, cacheKey);
        }
        return { loading: false, data: cached.value, error: cached.error };
      }
      return {
        loading: true,
        promise: cache.enqueue(fetcher.name, cacheKey, args, fetcher.fetch),
      };
    },
    [loading, fetcher, cacheKey],
  );

  useEffect(
    () => {
      if (result.loading) {
        setLoading(true);
        let shouldSetLoading = true;
        result.promise.then(() => {
          if (shouldSetLoading) {
            setLoading(false);
          }
        });
        return () => {
          shouldSetLoading = false;
        };
      }
      return undefined;
    },
    [result.loading && result.promise],
  );

  return result;
}

export type FetchListRequest<Values extends Array<unknown>> = {
  [i in keyof Values]: {
    fetcher: IFetcher<any, Values[i]>;
    args: any;
  }
};

export type FetchListResult<Values extends Array<unknown>> = {
  [i in keyof Values]: FetchResult<Values[i]>
};

export function useAllFetchers<Values extends Array<unknown>>(
  req: FetchListRequest<Values>,
): FetchListResult<Values> {
  const cache = useContext(CacheContext);
  const insideIsomorphic = useContext(IsomorphicMarkerContext);

  const cacheKeys = useMemo(() => req.map(({ fetcher, args }) => fetcher.hashKey(args)), [req]);
  const [loading, setLoading] = useState(false);

  const result = useMemo<FetchListResult<Values>>(
    () =>
      cacheKeys.map((cacheKey, i) => {
        const { fetcher, args } = req[i];
        const cached = cache.get(fetcher.name, cacheKey);
        if (cached) {
          if (insideIsomorphic && isServerCache(cache)) {
            cache.markAsExported(fetcher.name, cacheKey);
          }
          return { loading: false, data: cached.value, error: cached.error };
        }
        return {
          loading: true,
          promise: cache.enqueue(fetcher.name, cacheKey, args, fetcher.fetch),
        };
      }) as any,
    [loading, ...cacheKeys],
  );

  useEffect(() => {
    if (result.some((res) => res.loading)) {
      setLoading(true);
      let shouldSetLoading = true;
      const promises = result.map(
        (res) => (res.loading ? res.promise.catch(() => undefined) : Promise.resolve()),
      );
      Promise.all(promises).then(() => {
        if (shouldSetLoading) {
          setLoading(false);
        }
      });
      return () => {
        shouldSetLoading = false;
      };
    }
    return undefined;
  }, result.map((res) => res.loading));

  return result;
}
