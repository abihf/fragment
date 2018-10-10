export type Module<T> = { default?: T } | T;

export function extractModuleDefault<T>(mod: Module<T>): T {
  return (mod as any).default || mod;
}
