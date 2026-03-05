// lib/catex/handlers/mapHandlers.ts

import type { CatexEventData, CatexCallback } from "../../../components/features/catex/types";


export function onMouseClick(
  event: CatexEventData, 
  callback: CatexCallback
): void {
  if (callback) callback(event);
}