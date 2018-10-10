import { ICacheManager } from "./CacheManager";
import {
  FetchFunction,
  FetchOptions,
  FetchResult,
  IFetcher,
  KeyHasher,
} from "./Fetcher";
import { IServerCacheManager } from "./ServerCacheManager";

function defaultKeyHasher(key: any) {
  return String(key);
}

export type SimpleFetcherOption<K, V> = {
  name: string;
  fetch: FetchFunction<K, V>;
  hasher?: KeyHasher<K>;
};

export function createFetcher<K, V>({
  name,
  fetch,
  hasher,
}: SimpleFetcherOption<K, V>): IFetcher<K, V> {
  return {
    fetch(
      cache: ICacheManager,
      key: K,
      opt: FetchOptions = {},
    ): FetchResult<V> {
      const cacheKey = (hasher || defaultKeyHasher)(key);
      if (opt.dump && (cache as IServerCacheManager).markAsExported) {
        (cache as IServerCacheManager).markAsExported(name, cacheKey);
      }

      const cached = cache.get<V>(name, cacheKey);
      if (cached) {
        return { data: cached.value, error: cached.error, loading: false };
      }

      const promise = cache.enqueue(name, cacheKey, key, fetch);
      return { promise, loading: true };
    },
  };
}
