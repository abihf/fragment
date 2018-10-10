import { ICacheManager } from "./CacheManager";

export type FetchFunction<K, V> = (arg: K) => Promise<V>;

export type FetchResult<V> = {
  loading: boolean;
  promise?: Promise<V>;
  data?: V;
  error?: any;
};

export type KeyHasher<K> = (key: K) => string;

export type FetchOptions = {
  dump?: boolean;
  cacheKey?: string;
};

export interface IFetcher<K, V> {
  fetch: (cache: ICacheManager, key: K, opt?: FetchOptions) => FetchResult<V>;
}
