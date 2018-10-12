import { History } from "history";
import React, { ComponentType } from "react";
import ReactDOM, { Renderer } from "react-dom";
import Loadable from "react-loadable";
import { Route, Router, Switch } from "react-router-dom";

import { ICacheManager } from "../fetch/CacheManager";
import { CacheProvider } from "../fetch/CacheProvider";
import { ComponentWrapper, PageChunksMap, RouteConfig } from "../types";
import { onIdle } from "../utils/onIdle";
import { findRoute } from "../utils/routes";
import {} from "./global";
import { loadPageChunk, navigate, preloadPage } from "./routing";

export type ClientNavigationOption = {
  rootElement: Element;
  routes: RouteConfig;
  cacheManager: ICacheManager;
  history: History;
  wrapper: ComponentWrapper;
  renderer?: Renderer;
  chunks: PageChunksMap;
};

export function configureClientNavigation(
  option: Readonly<ClientNavigationOption>,
): boolean {
  let initialized = false;
  const { history, routes, chunks, rootElement } = option;
  const currentPath = history.location.pathname;

  window.fragmentNavigation = {
    chunks,
    history,
    routes,
  };

  history.listen((location) => {
    const prevUrl = currentPath;
    if (!initialized) {
      initialized = initRootComponent(option, prevUrl, location.pathname);
    }
  });

  rootElement.querySelectorAll("[data-fragment-link]").forEach((el) => {
    const target = el.getAttribute("href");
    if (!target) {
      return;
    }
    el.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(target);
    });

    const preload = el.getAttribute("data-fragment-preload");
    if (preload === "hover") {
      el.addEventListener("mouseover", () => {
        preloadPage(target).catch(() => undefined);
      });
    }
  });

  return false;
}
function initRootComponent(
  opt: Readonly<ClientNavigationOption>,
  prevUrl: string,
  nextUrl: string,
): boolean {
  const { history, routes, wrapper, renderer, rootElement, cacheManager } = opt;

  const nextRoute = findRoute(routes, nextUrl);
  if (nextRoute === undefined) {
    throw new Error("Not Found");
  }
  const prevRoute = findRoute(routes, prevUrl);
  if (prevRoute === nextRoute) {
    return false;
  }

  loadPageChunk(nextRoute.page, opt.chunks).then(() => {
    const RouteComponent = wrapper(
      generateRouteComponent(routes, history, opt.chunks),
    );

    rootElement.querySelectorAll("[data-fragment-root]").forEach((el) => {
      ReactDOM.unmountComponentAtNode(el);
    });

    (renderer || ReactDOM.render)(
      <CacheProvider value={cacheManager}>
        <RouteComponent />
      </CacheProvider>,
      rootElement,
      () => {
        // prefetch previous page for back operation
        if (prevRoute) {
          onIdle(() => {
            loadPageChunk(prevRoute.page, opt.chunks).catch(() => "ignore");
          });
        }
      },
    );
  });

  return true;
}

const DefaultLoading: React.SFC<Loadable.LoadingComponentProps> = () => null;

function generateRouteComponent(
  routes: RouteConfig,
  history: History,
  chunks: PageChunksMap,
): ComponentType {
  return () => (
    <Router history={history}>
      <Switch>
        {routes.map(({ page, loading, ...route }) => {
          const Comp = Loadable({
            loader: () => loadPageChunk(page, chunks),
            loading: loading || DefaultLoading,
          });

          return (
            <Route key={route.path} {...route}>
              <Comp />
            </Route>
          );
        })}
      </Switch>
    </Router>
  );
}
