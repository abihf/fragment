import { matchPath } from "react-router";
import { RouteConfig } from "../types";

export function findRoute(routes: RouteConfig, url: string) {
  return routes.find((route) => matchPath(url, route) !== null);
}
