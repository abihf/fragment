type IdleRegister = (callback: () => void) => void;

export function onIdle(callback: () => void) {
  const register: IdleRegister =
    (window as any).requestIdleCallback || setTimeout;
  register(callback);
}
