export type FetchFunction<K, V> = (arg: K) => Promise<V>;

export type PendingFetchResult<V> = {
  loading: true;
  promise: Promise<V>;
};

export type ResolvedFetchResult = {
  loading: false;
};

export type FetchResult<V> = (PendingFetchResult<V> | ResolvedFetchResult) & {
  data?: V;
  error?: any;
};

export type KeyHasher<K> = (key: K) => string;

export type FetchOptions = {
  dump?: boolean;
  cacheKey?: string;
};

export interface IFetcher<K, V> {
  name: string;
  fetch(key: K): Promise<V>;
  hashKey(key: K): string;
}
