// Fetch Component
export { Fetch, FetchProps } from "./fetch/Fetch";

// types for creating Fetcher
export {
  IFetcher,
  FetchOptions,
  FetchResult,
  FetchFunction,
  KeyHasher,
} from "./fetch/Fetcher";
export { ICacheManager } from "./fetch/CacheManager";

// utils for creating basic fetcher
export { createFetcher, SimpleFetcherOption } from "./fetch/SimpleFetcher";
export {
  createBatchFetcher,
  BatchFetcherOption,
  BatchFetchFunction,
} from "./fetch/BatchFetcher";

// Links components and utils
export { Link } from "./navigation/Link";
export { NavLink } from "./navigation/NavLink";
export { navigate, preloadPage } from "./navigation/routing";

// function for declaring isomorphic parts
export { isomorphic } from "./isomorphic/isomorphic";

// client side initialization
export { initClient, InitOptions } from "./client/initClient";

export * from "./types";

// react helmet component
export { default as Head } from "react-helmet";
