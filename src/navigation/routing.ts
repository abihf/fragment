import { LocationState } from "history";
import { ComponentType } from "react";
import { FragmentPage, PageChunksMap } from "../types";
import { extractModuleDefault } from "../utils/module";
import { findRoute } from "../utils/routes";

declare const __webpack_modules__: { [name: string]: boolean };
declare function __webpack_require__<T>(name: string | number): T;

const chunkPromises = new Map<string, Promise<void>>();

export function loadPageChunk(
  page: FragmentPage,
  chunks: PageChunksMap,
): Promise<ComponentType> {
  const scriptSrc = chunks[page.chunkName];
  const moduleId = page.pageModule;

  if (__webpack_modules__[moduleId]) {
    return Promise.resolve(__webpack_require__<ComponentType>(moduleId));
  }

  let promise = chunkPromises.get(scriptSrc);
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.addEventListener("load", () => {
        resolve();
        chunkPromises.delete(scriptSrc);
      });
      script.addEventListener("error", () => {
        reject(new Error(`Failed to load ${scriptSrc}`));
        chunkPromises.delete(scriptSrc);
      });
      document.getElementsByTagName("head")[0].appendChild(script);
    });
    chunkPromises.set(scriptSrc, promise);
  }

  return promise.then(() => {
    if (__webpack_modules__[moduleId]) {
      return extractModuleDefault(__webpack_require__<ComponentType>(moduleId));
    } else {
      throw new Error(
        `Script ${scriptSrc} does not contain module ${moduleId}`,
      );
    }
  });
}

export async function navigate(nextUrl: string, state?: LocationState) {
  window.fragmentNavigation.history.push(nextUrl, state);
}

export async function preloadPage(nextUrl: string): Promise<boolean> {
  const { history, routes, chunks } = window.fragmentNavigation;

  const prevUrl = history.location.pathname;
  const prevRoute = findRoute(routes, prevUrl);
  const nextRoute = findRoute(routes, nextUrl);
  if (nextRoute !== undefined && prevRoute !== nextRoute) {
    await loadPageChunk(nextRoute.page, chunks).catch((e) => {
      if (process.env.NODE_ENV !== "production") {
        // tslint:disable-next-line:no-console
        console.warn(e);
      }
    });
    return true;
  }
  return false;
}
