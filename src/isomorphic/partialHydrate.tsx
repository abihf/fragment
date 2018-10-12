import { History } from "history";
import React from "react";
import ReactDOM, { Renderer } from "react-dom";
import { Route, Router } from "react-router-dom";

import { CacheManager } from "../fetch/CacheManager";
import { CacheProvider } from "../fetch/CacheProvider";
import {
  ComponentWrapper,
  FragmentConfig,
  FragmentData,
  RouteConfig,
} from "../types";
import { extractModuleDefault } from "../utils/module";
import { findRoute } from "../utils/routes";

export type PartialHydrateOption = {
  routes: RouteConfig;
  data: FragmentData;
  cacheManager: CacheManager;
  history: History;
  wrapper: ComponentWrapper;
  renderer?: Renderer;
};

declare function __webpack_require__<T>(name: string | number): T;

export async function partialHydrate(opt: PartialHydrateOption): Promise<void> {
  const currentRoute = findRoute(opt.routes, location.pathname);
  if (!currentRoute) {
    throw new Error("Route not found");
  }

  const fragmentConfig = extractModuleDefault(
    __webpack_require__<FragmentConfig>(currentRoute.page.fragmentModule),
  );
  const renderer = opt.renderer || ReactDOM.hydrate;

  fragmentConfig.forEach(({ id, module }) => {
    const rootElement = document.getElementById("fragment-" + id);
    if (!rootElement) {
      return;
    }

    const Comp = opt.wrapper(extractModuleDefault(module));
    const props = opt.data.hydrateProps[id];

    renderer(
      <CacheProvider value={opt.cacheManager}>
        <Router history={opt.history}>
          <Route {...currentRoute}>
            <Comp {...props} />
          </Route>
        </Router>
      </CacheProvider>,
      rootElement,
    );
  });
}
