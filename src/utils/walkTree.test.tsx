import React, { createContext } from "react";
import { TreeWalkVisitor, walkTree } from "./walkTree";

describe("walkTree", () => {
  it("should consistently handle react's context with multiple call", () => {
    const Context = createContext<boolean>(false);
    let value1: boolean | undefined;
    let value2: boolean | undefined;
    const el = (
      <div>
        <Context.Provider value={true}>
          <Context.Consumer>
            {(ctx) => {
              value2 = ctx;
              return null;
            }}
          </Context.Consumer>
        </Context.Provider>
        <Context.Consumer>
          {(ctx) => {
            value1 = ctx;
            return null;
          }}
        </Context.Consumer>
      </div>
    );

    const dumpWalker: TreeWalkVisitor = () => true;

    walkTree(el, dumpWalker);
    walkTree(el, dumpWalker);
    expect(value1).toBe(false);
    expect(value2).toBe(true);
  });
});
