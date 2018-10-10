import {
  _generateCacheName,
  CacheManager,
  ICacheManager,
  InitialCache,
} from "./CacheManager";

export interface IServerCacheManager extends ICacheManager {
  wait(): Promise<void>;
  isReady(): boolean;
  generateInitialCache(): InitialCache;
  markAsExported(fetcherName: string, cacheKey: string): void;
}

export class ServerCacheManager extends CacheManager {
  protected exported = new Set<string>();

  constructor() {
    super({ store: new Map<string, any>() });
  }

  public wait(): Promise<void> {
    if (this.batchPromise) {
      return this.batchPromise.promise;
    }
    return Promise.resolve();
  }

  public isReady() {
    return this.fetchingCount === 0;
  }

  public markAsExported(fetcherName: string, cacheKey: string) {
    this.exported.add(_generateCacheName(fetcherName, cacheKey));
  }

  public generateInitialCache() {
    const result: InitialCache = {};
    this.exported.forEach((name) => {
      const [fetcherName, cacheKey] = name.split(":");
      if (!result[fetcherName]) {
        result[fetcherName] = {};
      }
      const item = this.store.get(name);
      result[fetcherName][cacheKey] = item && item.value;
    });
    return result;
  }
}
