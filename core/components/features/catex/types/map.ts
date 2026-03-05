// lib/catex/types/map.ts

import { CatexHandler } from "./common";

export interface MapEventData {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  feature?: unknown;
  [key: string]: unknown;
}


export interface CatexMapEvents {
  onMouseClick?: CatexHandler[];
  onMouseMove?: CatexHandler[];
  onMouseDoubleClick?: CatexHandler[];
}