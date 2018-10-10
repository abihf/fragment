import React, { ReactNode } from "react";

import { InsideIsomorphic } from "../isomorphic/IsomorphicMarker";
import { ICacheManager } from "./CacheManager";
import { CacheConsumer } from "./CacheProvider";
import { FetchResult, IFetcher } from "./Fetcher";

export type FetchProps<K, V> = {
  fetcher: IFetcher<K, V>;
  args: K;
  noThrows?: boolean;
  fallback?: ReactNode;
  children: (value: FetchResult<V>) => React.ReactNode;
};

type FetchBaseProps<K, V> = FetchProps<K, V> & {
  cache: ICacheManager;
  dump: boolean;
};

type FetchBaseState = {
  loading: boolean;
};

class FetchBase<K, V> extends React.Component<
  FetchBaseProps<K, V>,
  FetchBaseState
> {
  public state = {
    loading: false,
  };

  private lastLoadStatus = false;

  public componentDidMount() {
    if (this.lastLoadStatus) {
      this.setState({ loading: true });

      // is it possible that the promise is resolved
      // between render and mount time?
      const { promise } = this.fetch();
      if (promise) {
        promise
          .catch(() => undefined)
          .then(() => this.setState({ loading: false }));
      }
    }
  }

  public render() {
    const { noThrows, fallback } = this.props;
    const result = this.fetch();
    this.lastLoadStatus = result.loading;

    if (result.error && !noThrows) {
      throw result.error;
    }

    if (fallback && result.loading) {
      return fallback;
    }

    return this.props.children(result);
  }

  public fetch() {
    const { cache, fetcher, args, dump } = this.props;
    return fetcher.fetch(cache, args, { dump });
  }
}

export const Fetch = <K, V>(props: FetchProps<K, V>) => (
  <InsideIsomorphic>
    {(dump) => (
      <CacheConsumer>
        {(cache) => <FetchBase cache={cache} dump={dump} {...props} />}
      </CacheConsumer>
    )}
  </InsideIsomorphic>
);
