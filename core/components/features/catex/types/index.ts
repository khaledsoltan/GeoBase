// lib/catex/types/index.ts

export * from "./common";
export * from "./map";



import { CatexMapEvents } from "./map";




export interface CatexConfig {
  map?: CatexMapEvents;
  // layer?: CatexLayerEvents;
  // ui?: CatexUIEvents;
}


declare global {
  interface Window {
    catex?: CatexConfig;
  }
}


export { default as CatexMapClick } from "../UI/events/catexmapclick/CatexMapClick";
