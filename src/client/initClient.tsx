import { Renderer } from "react-dom";

import { createBrowserHistory } from "history";
import { CacheManager } from "../fetch/CacheManager";
import { partialHydrate } from "../isomorphic/partialHydrate";
import { configureClientNavigation } from "../navigation/clientNavigation";
import { ComponentWrapper, FragmentData, RouteConfig } from "../types";

export type InitOptions = {
  rootElement: Element;
  routes: RouteConfig;
  data: FragmentData;

  fragmentWrapper?: ComponentWrapper;
  fragmentRenderer?: Renderer;

  rootWrapper?: ComponentWrapper;
  rootRenderer?: Renderer;
};

const defaultComponentWrapper: ComponentWrapper = (component) => component;

export async function initClient({
  rootElement,
  routes,
  data,
  fragmentWrapper = defaultComponentWrapper,
  fragmentRenderer,
  rootRenderer,
  rootWrapper = defaultComponentWrapper,
}: InitOptions): Promise<void> {
  // initialize cache manager, and set lru cache to only store 500 item
  const cacheManager = new CacheManager({
    initialCache: data.cache,
    lruOption: {
      max: Math.max(500, Object.keys(data.cache).length),
    },
  });

  const history = createBrowserHistory();

  const fullyRendered = configureClientNavigation({
    cacheManager,
    history,
    renderer: rootRenderer,
    rootElement,
    routes,
    wrapper: rootWrapper,
  });

  if (!fullyRendered) {
    await partialHydrate({
      cacheManager,
      data,
      history,
      renderer: fragmentRenderer,
      routes,
      wrapper: fragmentWrapper,
    });
  }
}
