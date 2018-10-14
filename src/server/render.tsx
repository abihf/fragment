import FS from "fs";
import Path from "path";

import React, { ComponentType, ReactElement } from "react";
import ReactDOMServer from "react-dom/server";
import Helmet, { HelmetData } from "react-helmet";
import { Route, StaticRouterContext } from "react-router";
import { matchPath, StaticRouter } from "react-router-dom";

import { CacheProvider } from "../fetch/CacheProvider";
import { ServerCacheManager } from "../fetch/ServerCacheManager";
import { IsomorphicProvider } from "../isomorphic/isomorphic";
import { FragmentData, HydrateProps, RouteConfig } from "../types";
import { extractModuleDefault } from "../utils/module";
import { walkTree } from "../utils/walkTree";

const fragmentManifestFile = Path.resolve("./build/fragments.map.json");
const fragmentManifest: { [id: string]: string[] } = JSON.parse(
  FS.readFileSync(fragmentManifestFile, "utf-8"),
);

export type TemplateData<T> = {
  content: T;
  data: FragmentData;
  helmet: HelmetData;
  scripts: string[];
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
  assets: RazzleAsset;
  routes: RouteConfig;
  url: string;
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

  const component = extractModuleDefault(await page.loader());
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

  const scripts = ["runtime", "vendors", "commons", "client"]
    .map((name) => opt.assets[name] && (opt.assets[name].js as string))
    .filter(Boolean);
  const fragmentScripts = fragmentManifest[currentRoute.page.fragmentModule];
  if (fragmentScripts) {
    scripts.splice(scripts.length - 1, 0, ...fragmentScripts);
  }

  const templateData: TemplateData<T> = {
    content,
    helmet,
    scripts,

    data: {
      cache: cacheManager.generateInitialCache(),
      hydrateProps,
    },
  };
  const html = opt.template(templateData);

  return {
    html,
    redirectUrl: routerContext.url,
  };
}
