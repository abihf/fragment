import React, { ComponentType, CSSProperties } from "react";
import { matchPath, RouteComponentProps, withRouter } from "react-router";
import { Link, LinkProps } from "./Link";

type NavLinkProps = LinkProps & {
  exact?: boolean;

  activeClassName?: string;
  activeStyle?: CSSProperties;
};

export const NavLink: ComponentType<NavLinkProps> = withRouter<
  NavLinkProps & RouteComponentProps
>((originProps) => {
  const {
    to,
    exact,
    activeClassName = "active",
    activeStyle,

    match,
    history,
    location,
    staticContext,

    ...props
  } = originProps;

  if (activeClassName || activeStyle) {
    const match = matchPath(history.location.pathname, {
      path: to,
      exact,
    });

    if (match && activeClassName) {
      props.className = props.className
        ? `${props.className} ${activeClassName}`
        : activeClassName;
    }

    if (match && activeStyle) {
      props.style = { ...props.style, ...activeStyle };
    }
  }

  return <Link to={to} {...props} />;
}) as any;
