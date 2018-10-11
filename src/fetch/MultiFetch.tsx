import React, { Component, ReactNode } from "react";
import { InsideIsomorphic } from "../isomorphic/IsomorphicMarker";
import { ICacheManager } from "./CacheManager";
import { CacheConsumer } from "./CacheProvider";
import { FetchResult, IFetcher } from "./Fetcher";

type FetchRequestItem<T> = {
  fetcher: IFetcher<T, any>;
  args: any;
};

export type FetchRequest<Values extends { [key: string]: any }> = {
  [i in keyof Values]: FetchRequestItem<Values[i]>
};

type MultiFetchResult<Values> = { [i in keyof Values]: FetchResult<Values[i]> };

type MultiFetchProps<Values> = {
  fetch: FetchRequest<Values>;
  noThrows?: boolean;
  fallback?: ReactNode;
  children: (res: MultiFetchResult<Values>) => ReactNode;
};

type MultiFetchBaseProps<Values> = MultiFetchProps<Values> & {
  cache: ICacheManager;
  dump: boolean;
};

class MultiFetchBase<Values extends { [key: string]: any }> extends Component<
  MultiFetchBaseProps<Values>
> {
  public render() {
    const { noThrows, fallback } = this.props;
    const result = this.fetch();

    if (!noThrows) {
      const err = Object.values(result).find((res) => res.error);
      if (err) {
        throw result.error;
      }
    }

    if (fallback) {
      if (Object.values(result).find((res) => res.loading)) {
        return fallback;
      }
    }

    return this.props.children(result);
  }

  public fetch(): MultiFetchResult<Values> {
    const { cache, fetch } = this.props;
    const results = Object.keys(fetch).map(async (key) => {
      const item = fetch[key];
      return { [key]: item.fetcher.fetch(cache, item.args) };
    });
    return results.reduce(
      (result, current) => Object.assign(result, current),
      {} as any,
    );
  }
}

export function MultiFetch<
  Values extends { [key: string]: FetchRequestItem<any> }
>(props: MultiFetchProps<Values>) {
  return (
    <CacheConsumer>
      {(cache) => (
        <InsideIsomorphic>
          {(dump) => <MultiFetchBase cache={cache} dump={dump} {...props} />}
        </InsideIsomorphic>
      )}
    </CacheConsumer>
  );
}
