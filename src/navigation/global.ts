import { History } from "history";

import { PageChunksMap, RouteConfig } from "../types";

declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    fragmentNavigation: {
      history: History;
      routes: RouteConfig;
      chunks: PageChunksMap;
    };
  }
}
