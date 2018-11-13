import React, { ComponentType, createContext } from "react";
import { defaultCacheManager, ICacheManager } from "./CacheManager";

const Context = createContext<ICacheManager>(defaultCacheManager);

export const CacheContext = Context;
export const CacheProvider = Context.Provider;
export const CacheConsumer = Context.Consumer;

type CacheProp = { cacheManager: ICacheManager };

export function withCacheManager<T>(
  Comp: ComponentType<T & CacheProp>,
): ComponentType<T> {
  return (props) => (
    <CacheConsumer>
      {(cacheManager) => <Comp {...props} cacheManager={cacheManager} />}
    </CacheConsumer>
  );
}
