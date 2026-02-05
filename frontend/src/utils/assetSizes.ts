import { ObjectType } from "../types";

export const ASSET_SIZES: Record<ObjectType["type"], { width: number; height: number }> = {
  board: { width: 2, height: 1 },       // 2x1
  projector: { width: 2, height: 1 },   // 2x1
  fan: { width: 2, height: 2 },         // 2x2
  table: { width: 1, height: 1 },       // 1x1
  ac: { width: 1, height: 2 },          // 1x2
  chair: { width: 1, height: 1 },       // 1x1
  tablechair: { width: 1, height: 1 },  // 1x1 (combined)
  door: { width: 1, height: 2 }         // 1x2
};

export const getAssetSize = (type: ObjectType["type"]) => {
  return ASSET_SIZES[type] || { width: 1, height: 1 };
};
