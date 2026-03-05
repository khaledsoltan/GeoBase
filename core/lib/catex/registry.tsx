import type { CatexHandler, CatexConfig } from "../../components/features/catex/types";



class CatexRegistry {
  private handlers: Map<string, CatexHandler[]> = new Map();

  on(
    namespace: string,
    event: string,
    actionFn: CatexHandler["action"]
  ): void {
    const key = `${namespace}.${event}`;

    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }

    this.handlers.get(key)!.push({ action: actionFn });
  }

  
  install(): void {
    if (typeof window === "undefined") return;

    const catex: CatexConfig = {};

    this.handlers.forEach((handlers, key) => {
      const [namespace, event] = key.split(".");

      if (!catex[namespace as keyof CatexConfig]) {
        (catex as Record<string, unknown>)[namespace] = {};
      }

      const ns = (catex as Record<string, Record<string, CatexHandler[]>>)[namespace];
      ns[event] = handlers;
    });

    window.catex = catex;
  }
}

export const catexRegistry = new CatexRegistry();