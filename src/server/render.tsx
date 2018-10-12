import React, { ComponentType, ReactElement } from "react";
import ReactDOMServer from "react-dom/server";
import Helmet, { HelmetData } from "react-helmet";
import { Route, StaticRouterContext } from "react-router";
import { matchPath, StaticRouter } from "react-router-dom";

import { CacheProvider } from "../fetch/CacheProvider";
import { ServerCacheManager } from "../fetch/ServerCacheManager";
import { IsomorphicProvider } from "../isomorphic/isomorphic";
import {
  FragmentData,
  HydrateProps,
  PageChunksMap,
  RouteConfig,
} from "../types";
import { extractModuleDefault } from "../utils/module";
import { walkTree } from "../utils/walkTree";

export type TemplateData<T> = {
  content: T;
  scripts: string[];
  data: FragmentData;
  helmet: HelmetData;
};

export type ServerRenderFunction<T> = (
  element: ReactElement<any>,
) => T | PromiseLike<T>;

export type RazzleAsset = {
  [name: string]: {
    js?: string;
    css?: string;
  };
};

export type RenderOptions<T> = {
  routes: RouteConfig;
  url: string;
  assets: RazzleAsset;
  componentWrapper?: (component: ComponentType) => ComponentType;
  renderer?: ServerRenderFunction<T>;
  template: (d: TemplateData<T>) => string;
};

export type RenderResult = {
  html: string;
  redirectUrl?: string;
};

function defaultComponentWrapper(component: ComponentType) {
  return component;
}

const defaultRenderer: ServerRenderFunction<any> = (el) =>
  ReactDOMServer.renderToString(el);

export async function render<T = string>(
  opt: RenderOptions<T>,
): Promise<RenderResult> {
  const currentRoute = opt.routes.find(
    (route) => matchPath(opt.url, route) !== null,
  );
  if (!currentRoute) {
    throw Error("Not found");
  }

  const { page, ...routeProps } = currentRoute;

  const component = extractModuleDefault(page.component);
  const componentWrapper = opt.componentWrapper || defaultComponentWrapper;
  const EnhancedComponent = componentWrapper(component);

  const cacheManager = new ServerCacheManager();
  const routerContext: StaticRouterContext = {};
  const hydrateProps: HydrateProps = {};

  const app = (
    <CacheProvider value={cacheManager}>
      <StaticRouter context={routerContext} location={opt.url}>
        <IsomorphicProvider value={hydrateProps}>
          <Route {...routeProps}>
            <EnhancedComponent />
          </Route>
        </IsomorphicProvider>
      </StaticRouter>
    </CacheProvider>
  );

  do {
    await cacheManager.wait();
    walkTree(app, () => true);
  } while (!cacheManager.isReady());
  const helmet = Helmet.renderStatic();

  const renderer: ServerRenderFunction<T> = opt.renderer || defaultRenderer;
  const content = await Promise.resolve(renderer(app));
  const { assets } = opt;
  const scripts = [
    "runtime",
    "vendors",
    "commons",
    "fragment-" + currentRoute.page.chunkName,
    "client",
  ]
    .filter((name) => assets[name] && assets[name].js)
    .map((name) => assets[name].js as string);

  const chunks = opt.routes
    .map((route) => route.page.chunkName)
    .reduce<PageChunksMap>((result, name) => {
      result[name] = assets["page-" + name].js as string;
      return result;
    }, {});

  const templateData: TemplateData<T> = {
    content,
    helmet,
    scripts,

    data: {
      cache: cacheManager.generateInitialCache(),
      chunks,
      hydrateProps,
    },
  };
  const html = opt.template(templateData);

  return {
    html,
    redirectUrl: routerContext.url,
  };
}
