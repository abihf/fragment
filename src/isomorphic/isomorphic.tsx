import React, { Component, ComponentType, createContext } from "react";

import { HydrateProps } from "../types";
import { extractModuleDefault, Module } from "../utils/module";
import { BeginIsomorphic } from "./IsomorphicMarker";

const Context = createContext<HydrateProps | undefined>(undefined);

export const IsomorphicProvider = Context.Provider;

type IsomorphicProps = {
  hydrateProps?: HydrateProps;
};

export function isomorphic<T>(
  name: string,
  mod: Module<ComponentType<T>> | Promise<Module<ComponentType<T>>>,
): ComponentType<T> {
  class Isomorphic extends Component<IsomorphicProps> {
    public render() {
      const Comp = extractModuleDefault(mod as any);
      const { hydrateProps, ...props } = this.props;

      if (hydrateProps && Object.keys(props).length > 0) {
        hydrateProps[name] = props;
      }

      return (
        <BeginIsomorphic>
          <div id={`fragment-${name}`} data-fragment-root={name}>
            <Comp {...props} />
          </div>
        </BeginIsomorphic>
      );
    }
  }

  return (props: any) => (
    <Context.Consumer>
      {(data) => <Isomorphic hydrateProps={data} {...props} />}
    </Context.Consumer>
  );
}
