import { Layout } from "../../types";

/**
 * Room 101 - Default Layout Template
 * This is the standard classroom layout used as the default template
 * for new or template-based room configurations.
 * 
 * Layout includes:
 * - 2 Boards
 * - 2 Projectors
 * - 4 ACs (corners)
 * - 4 Fans (corners)
 * - 20 Tables (4 rows x 5 columns)
 * - 20 Chairs (paired with tables)
 */
export const getRoom101Layout = (): Layout => {
  return {
    layoutType: "layout1",
    gridRows: 14,
    gridCols: 22,
    assets: {
      board: [
        { number: 1, row: 0, col: 10, status: "working" },
        { number: 2, row: 0, col: 14, status: "working" }
      ],
      projector: [
        { number: 1, row: 2, col: 10, status: "working" },
        { number: 2, row: 2, col: 14, status: "working" }
      ],
      ac: [
        { number: 1, row: 5, col: 0, status: "working" },
        { number: 2, row: 5, col: 21, status: "working" },
        { number: 3, row: 8, col: 0, status: "working" },
        { number: 4, row: 8, col: 21, status: "working" }
      ],
      fan: [
        { number: 1, row: 0, col: 0, status: "working" },
        { number: 2, row: 0, col: 20, status: "working" },
        { number: 3, row: 12, col: 0, status: "working" },
        { number: 4, row: 12, col: 20, status: "working" }
      ],
      table: [
        { number: 1, row: 5, col: 2, status: "working" },
        { number: 2, row: 5, col: 4, status: "working" },
        { number: 3, row: 5, col: 6, status: "working" },
        { number: 4, row: 5, col: 8, status: "working" },
        { number: 5, row: 6, col: 2, status: "working" },
        { number: 6, row: 6, col: 4, status: "working" },
        { number: 7, row: 6, col: 6, status: "working" },
        { number: 8, row: 6, col: 8, status: "working" },
        { number: 9, row: 7, col: 2, status: "working" },
        { number: 10, row: 7, col: 4, status: "working" },
        { number: 11, row: 7, col: 6, status: "working" },
        { number: 12, row: 7, col: 8, status: "working" },
        { number: 13, row: 8, col: 2, status: "working" },
        { number: 14, row: 8, col: 4, status: "working" },
        { number: 15, row: 8, col: 6, status: "working" },
        { number: 16, row: 8, col: 8, status: "working" },
        { number: 17, row: 9, col: 2, status: "working" },
        { number: 18, row: 9, col: 4, status: "working" },
        { number: 19, row: 9, col: 6, status: "working" },
        { number: 20, row: 9, col: 8, status: "working" }
      ],
      tablechair: [],
      chair: [
        { number: 1, row: 5, col: 3, status: "working" },
        { number: 2, row: 5, col: 5, status: "working" },
        { number: 3, row: 5, col: 7, status: "working" },
        { number: 4, row: 5, col: 9, status: "working" },
        { number: 5, row: 6, col: 3, status: "working" },
        { number: 6, row: 6, col: 5, status: "working" },
        { number: 7, row: 6, col: 7, status: "working" },
        { number: 8, row: 6, col: 9, status: "working" },
        { number: 9, row: 7, col: 3, status: "working" },
        { number: 10, row: 7, col: 5, status: "working" },
        { number: 11, row: 7, col: 7, status: "working" },
        { number: 12, row: 7, col: 9, status: "working" },
        { number: 13, row: 8, col: 3, status: "working" },
        { number: 14, row: 8, col: 5, status: "working" },
        { number: 15, row: 8, col: 7, status: "working" },
        { number: 16, row: 8, col: 9, status: "working" },
        { number: 17, row: 9, col: 3, status: "working" },
        { number: 18, row: 9, col: 5, status: "working" },
        { number: 19, row: 9, col: 7, status: "working" },
        { number: 20, row: 9, col: 9, status: "working" }
      ],
      door: []
    }
  };
};
