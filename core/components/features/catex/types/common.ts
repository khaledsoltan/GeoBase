/**
 * Base event data — every catex event will have at least these.
 */
export interface CatexEventData {
  [key: string]: unknown;
}



/**
 * Base callback signature.
 */
export type CatexCallback = (o: CatexEventData) => void;



/**
 * Base handler — the { action: function(o, callback) } pattern.
 */
export interface CatexHandler {
  action: (o: CatexEventData, callback: CatexCallback) => void;
}