import React, { AllHTMLAttributes, ComponentType } from "react";
import { withIsomirphicMarker } from "../isomorphic/IsomorphicMarker";
import { navigate, preloadPage } from "./routing";

type PreloadOption = "hover" | "none";

export type LinkProps = AllHTMLAttributes<any> & {
  component?: string | ComponentType;
  to: string;
  state?: any;
  preload?: PreloadOption;
  forwardHref?: boolean;

  [name: string]: any;
};

export const Link = withIsomirphicMarker<LinkProps>((originProps) => {
  const {
    component: Comp = "a",
    forwardHref,

    to,
    state,

    insideIsomorphic,
    preload = "none",

    ...props
  } = originProps;

  if (Comp === "a" || forwardHref) {
    props.href = to;
  }

  if (!insideIsomorphic && typeof window === "undefined") {
    props["data-fragment-link"] =
      state === undefined ? "" : JSON.stringify(state);
    if (preload !== "none") {
      props["data-fragment-preload"] = preload;
    }
  }

  if (preload === "hover") {
    props.onMouseOver = () => preloadPage(to).catch(() => undefined);
  }

  return (
    <Comp
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        navigate(to, state);
        return false;
      }}
      {...props}
    />
  );
});
