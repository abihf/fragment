import PendingPromise from "../utils/PendingPromise";
import { IFetcher, KeyHasher } from "./Fetcher";
import { createFetcher } from "./SimpleFetcher";

export type BatchFetchFunction<K, V> = (ids: K[]) => Promise<V[]>;

export type BatchFetcherOption<K, V> = {
  name: string;
  fetch: BatchFetchFunction<K, V>;
  hasher?: KeyHasher<K>;
};

export function createBatchFetcher<K, V>({
  name,
  fetch,
  hasher,
}: BatchFetcherOption<K, V>): IFetcher<K, V> {
  // promises

  const promises = new Map<K, PendingPromise<V>>();
  let queue = new Set<K>();
  let scheduled = false;

  const batchFetch = () => {
    scheduled = false;

    if (queue.size === 0) {
      return;
    }

    const processQueue = Array.from(queue);
    queue = new Set();

    let error: any;
    let results: V[];

    fetch(processQueue)
      .then((r) => (results = r))
      .catch((e) => (error = e))
      .then(() => {
        processQueue.forEach((key, i) => {
          const pp = promises.get(key);
          if (pp) {
            if (error) {
              pp.reject(error);
            } else {
              pp.resolve(results[i]);
            }
          }
          promises.delete(key);
        });
      });
  };

  return createFetcher({
    hasher,
    name,
    fetch(args): Promise<V> {
      const cachedPromise = promises.get(args);
      if (cachedPromise) {
        return cachedPromise.promise;
      }

      const pp = new PendingPromise<V>();
      promises.set(args, pp);
      queue.add(args);

      if (!scheduled) {
        setTimeout(batchFetch, 1);
        scheduled = true;
      }

      return pp.promise;
    },
  });
}
