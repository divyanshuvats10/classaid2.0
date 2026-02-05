import { Layout } from "../types";
import { getRoom101Layout } from "./layouts/room101Layout";

export const getDefaultLayout1 = (): Layout => {
  return getRoom101Layout();
};

export const getEmptyLayout = (): Layout => {
  return {
    layoutType: "custom",
    gridRows: 14,
    gridCols: 22,
    positions: []
  };
};
