export function emitAction(action: number, parameters?: any): void {
  const catex = (window as any).catex;

  if (!catex?.workspace?.emitCommand) {
    console.warn(`[catex] workspace not ready, action queued: ${action}`);
    setTimeout(() => {
      const retry = (window as any).catex;
      if (retry?.workspace?.emitCommand) {
        retry.workspace.emitCommand({ action, parameters });
        console.log(`[catex] Action emitted (delayed): ${action}`);
      } else {
        console.error(`[catex] workspace unavailable, action lost: ${action}`);
      }
    }, 1000);
    return;
  }

  catex.workspace.emitCommand({ action, parameters });
  console.log(`[catex] Action emitted: ${action}`);
}

export function emitActionByName(name: string, actionsConfig: Record<string, any>): void {
  const entry = actionsConfig[name];
  if (entry?.action) {
    emitAction(entry.action);
  } else {
    console.warn(`[catex] No action found for: ${name}`);
  }
}