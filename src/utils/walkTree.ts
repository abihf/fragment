import React from "react";

export type TreeWalkerContext = {
  [key: string]: any;
};

function getProps<P>(element: React.ReactElement<P>): P {
  return element.props;
}

function isReactElement(
  element: React.ReactNode,
): element is React.ReactElement<any> {
  return !!(element as any).type;
}

function isComponentClass(
  Comp: React.ComponentType<any>,
): Comp is React.ComponentClass<any> {
  return (
    Comp.prototype && (Comp.prototype.render || Comp.prototype.isReactComponent)
  );
}

function providesChildContext(
  instance: React.Component<any>,
): instance is React.Component<any> & React.ChildContextProvider<any> {
  return !!(instance as any).getChildContext;
}

class ImmutableMap<K = any, V = any> {
  private map: Map<K, V>;

  constructor(parent?: ImmutableMap<K, V>) {
    this.map = parent ? new Map(parent.map) : new Map();
  }

  public set(key: K, value: V): ImmutableMap<K, V> {
    const res = new ImmutableMap(this);
    res.map.set(key, value);
    return res;
  }

  public get(key: K): V | undefined {
    return this.map.get(key);
  }
}

// This function is "borrowed" react-apollo.
// with some modification to handle React.createContext
//
// https://github.com/apollographql/react-apollo/blob/master/src/getDataFromTree.ts
export type TreeWalkVisitor = (
  element: React.ReactNode,
  instance: React.Component<any> | null,
  context: TreeWalkerContext,
  childContext?: TreeWalkerContext,
) => boolean | void;

export function walkTree(
  rootElement: React.ReactNode,
  visitor: TreeWalkVisitor,
) {
  const walk = (
    element: React.ReactNode,
    context: TreeWalkerContext,
    contextMap: ImmutableMap,
  ) => {
    if (Array.isArray(element)) {
      element.forEach((item) => walk(item, context, contextMap));
      return;
    }

    if (!element) {
      return;
    }

    // A stateless functional component or a class
    if (isReactElement(element)) {
      if (typeof element.type === "function") {
        const Comp = element.type;
        const props = Object.assign({}, Comp.defaultProps, getProps(element));
        let childContext = context;
        let child;

        // Are we are a react class?
        if (isComponentClass(Comp)) {
          const instance = new Comp(props, context);
          // In case the user doesn't pass these to super in the constructor.
          // Note: `Component.props` are now readonly in `@types/react`, so
          // we're using `defineProperty` as a workaround (for now).
          Object.defineProperty(instance, "props", {
            value: instance.props || props,
          });
          instance.context = instance.context || context;

          // Set the instance state to null (not undefined) if not set, to match React behaviour
          instance.state = instance.state || null;

          // Override setState to just change the state, not queue up an update
          // (we can't do the default React thing as we aren't mounted
          // "properly", however we don't need to re-render as we only support
          // setState in componentWillMount, which happens *before* render).
          instance.setState = (newState) => {
            if (typeof newState === "function") {
              // React's TS type definitions don't contain context as a third parameter for
              // setState's updater function.
              // Remove this cast to `any` when that is fixed.
              newState = (newState as any)(
                instance.state,
                instance.props,
                instance.context,
              );
            }
            instance.state = Object.assign({}, instance.state, newState);
          };

          if (Comp.getDerivedStateFromProps) {
            const result = Comp.getDerivedStateFromProps(
              instance.props,
              instance.state,
            );
            if (result !== null) {
              instance.state = Object.assign({}, instance.state, result);
            }
          } else if (instance.UNSAFE_componentWillMount) {
            instance.UNSAFE_componentWillMount();
          } else if (instance.componentWillMount) {
            instance.componentWillMount();
          }

          if (providesChildContext(instance)) {
            childContext = Object.assign(
              {},
              context,
              instance.getChildContext(),
            );
          }

          if (visitor(element, instance, context, childContext) === false) {
            return;
          }

          child = instance.render();
        } else {
          // Just a stateless functional
          if (visitor(element, null, context) === false) {
            return;
          }

          child = Comp(props, context);
        }

        if (child) {
          if (Array.isArray(child)) {
            child.forEach((item) => walk(item, childContext, contextMap));
          } else {
            walk(child, childContext, contextMap);
          }
        }
      } else if (
        (element.type as any)._context ||
        (element.type as any).Consumer
      ) {
        // A React context provider or consumer
        if (visitor(element, null, context) === false) {
          return;
        }

        let child;
        let newContextMap = contextMap;
        if ((element.type as any)._context) {
          // A provider - sets the context value before rendering children
          newContextMap = contextMap.set(element.type, element.props.value);
          child = element.props.children;
        } else {
          // A consumer
          const provider = (element.type as any).Provider;
          const value = newContextMap.get(provider);

          child = element.props.children(
            value || provider._context._currentValue,
          );
        }

        if (child) {
          if (Array.isArray(child)) {
            child.forEach((item) => walk(item, context, newContextMap));
          } else {
            walk(child, context, newContextMap);
          }
        }
      } else {
        // A basic string or dom element, just get children
        if (visitor(element, null, context) === false) {
          return;
        }

        if (element.props && element.props.children) {
          React.Children.forEach(element.props.children, (child: any) => {
            if (child) {
              walk(child, context, contextMap);
            }
          });
        }
      }
    } else if (typeof element === "string" || typeof element === "number") {
      // Just visit these, they are leaves so we don't keep traversing.
      visitor(element, null, context);
    }
    // TODO: Portals?
  };

  return walk(rootElement, {}, new ImmutableMap());
}
