import LRU from "lru-cache";
import PendingPromise from "../utils/PendingPromise";
import { FetchFunction } from "./Fetcher";

export type InitialCache = {
  [fetcherName: string]: { [cacheKey: string]: any };
};

export interface ICacheManager {
  get<V>(fetcherName: string, cacheKey: string): CacheItem<V> | undefined;

  enqueue<K, V>(
    fetcherName: string,
    cacheKey: string,
    key: K,
    func: FetchFunction<K, V>,
  ): Promise<V>;
}

type CacheStore = {
  get<T = any>(name: string): CacheItem<T> | undefined;
  set<T = any>(name: string, value: CacheItem<T>): void;
};

type CacheManagerOption = {
  store?: CacheStore;
  initialCache?: InitialCache;
  lruOption?: LRU.Options;
};

export type CacheItem<T = any> = {
  value?: T;
  error?: any;
};

export function _generateCacheName(fetcherName: string, cacheKey: string) {
  return `${fetcherName}:${cacheKey}`;
}

export class CacheManager implements ICacheManager {
  protected store: CacheStore;

  protected promises = new Map<string, Promise<any>>();
  protected fetchingCount = 0;
  protected batchPromise?: PendingPromise<void>;

  constructor({ store, initialCache, lruOption }: CacheManagerOption = {}) {
    const initialStore: CacheStore = store || LRU<string, any>(lruOption);

    if (initialCache) {
      Object.entries(initialCache).forEach(([fetcherName, keys]) => {
        Object.entries(keys).forEach(([key, value]) => {
          initialStore.set(_generateCacheName(fetcherName, key), { value });
        });
      });
    }
    this.store = initialStore;
  }

  public get<V>(
    fetcherName: string,
    cacheKey: string,
  ): CacheItem<V> | undefined {
    return this.store.get(_generateCacheName(fetcherName, cacheKey));
  }

  public enqueue<K, V>(
    fetcherName: string,
    cacheKey: string,
    key: K,
    func: FetchFunction<K, V>,
  ): Promise<V> {
    const cacheName = _generateCacheName(fetcherName, cacheKey);

    const cachedPromise = this.promises.get(cacheName);
    if (cachedPromise) {
      return cachedPromise;
    }

    this.fetchingCount++;
    if (!this.batchPromise) {
      this.batchPromise = new PendingPromise();
    }

    const promise = func(key);
    this.promises.set(cacheName, promise);

    promise
      .then((value) => {
        this.store.set(cacheName, { value });
      })
      .catch((error) => {
        this.store.set(cacheName, { error });
      })
      .then(() => {
        this.fetchingCount--;
        this.promises.delete(cacheName);
        if (this.fetchingCount <= 0 && this.batchPromise) {
          this.batchPromise.resolve();
          this.batchPromise = undefined;
          this.fetchingCount = 0; // just to make sure
        }
      });

    return promise;
  }
}

export const defaultCacheManager = new CacheManager();
