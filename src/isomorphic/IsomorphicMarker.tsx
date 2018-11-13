import React, { createContext } from "react";

const Context = createContext<boolean>(false);

export const BeginIsomorphic: React.SFC = ({ children }) => (
  <Context.Provider value={true}>{children}</Context.Provider>
);

export const IsomorphicMarkerContext = Context;
export const IsomorphicMarkerProvider = Context.Provider;
export const InsideIsomorphic = Context.Consumer;

type withIsomprohicMarkerProps = {
  insideIsomorphic: boolean;
};

export function withIsomirphicMarker<T>(
  Comp: React.ComponentType<withIsomprohicMarkerProps & T>,
): React.ComponentType<Exclude<T, "insideIsomorphic">> {
  return (props) => (
    <Context.Consumer>
      {(insideIsomorphic) => (
        <Comp {...props} insideIsomorphic={insideIsomorphic} />
      )}
    </Context.Consumer>
  );
}
