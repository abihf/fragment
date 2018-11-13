import { FetchFunction, IFetcher, KeyHasher } from "./Fetcher";

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
    fetch,
    hashKey: hasher || defaultKeyHasher,
    name,
  };
}
