import { ComponentType } from "react";
import { LoadingComponentProps } from "react-loadable";
import { RouteProps } from "react-router";
import { Module } from "./utils/module";

type ModuleLoader<T> = () => Promise<Module<T>>;

export type FragmentConfig = FragmentConfigItem[];

export type FragmentConfigItem = {
  id: string;
  module: Module<ComponentType>;
};

export type RouteConfig = RouteConfigItem[];

export type RouteConfigItem = RouteProps & {
  loading?: React.ComponentType<LoadingComponentProps>;
  page: FragmentPage;
};

export type FragmentPage = {
  fragments: ModuleLoader<FragmentConfig>;
  loader: ModuleLoader<ComponentType>;
};

export type FragmentData = {
  hydrateProps: HydrateProps;
  cache: any;
};

export type HydrateProps = {
  [name: string]: any;
};

export type ComponentWrapper = (component: ComponentType) => ComponentType;

// this function will be replaced by fragment-normalizer loader
export declare function loadFragmentPage(
  importer: Promise<Module<ComponentType>>,
): FragmentPage;
