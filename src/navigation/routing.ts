import { LocationState } from "history";
import { findRoute } from "../utils/routes";

export async function navigate(nextUrl: string, state?: LocationState) {
  window._history.push(nextUrl, state);
}

export async function preloadPage(nextUrl: string): Promise<boolean> {
  const history = window._history;
  const routes = window._routes;

  const prevUrl = history.location.pathname;
  const prevRoute = findRoute(routes, prevUrl);
  const nextRoute = findRoute(routes, nextUrl);
  if (nextRoute !== undefined && prevRoute !== nextRoute) {
    await nextRoute.page.loader().catch(() => undefined);
    return true;
  }
  return false;
}
