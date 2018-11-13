import * as React from "react";

declare module "react" {
  type StateUpdater<T> = (updater: T | ((prevState: T) => T)) => void;

  export function useState<T>(init: T | (() => T)): [T, StateUpdater<T>];

  export function useEffect(
    effect: () => unknown,
    keepers: ReadonlyArray<unknown>,
  ): void;

  export function useRef<T>(init: T | (() => T)): { current: T };
  export function useRef<T>(): { current?: T };

  export function useMemo<T>(init: () => T, keepers: ReadonlyArray<unknown>): T;

  export function useContext<T>(context: React.Context<T>): T;
}
