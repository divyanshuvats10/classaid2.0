import { Layout, ObjectType } from "../types";
import { ASSET_SIZES } from "../utils/assetSizes";
import { TYPE_COLORS } from "../utils/typeColors";

interface RoomLayoutViewProps {
  layout: Layout;
  objects: ObjectType[];
  onAssetClick?: (objectNumber: string) => void;
}

const RoomLayoutView = ({ layout, objects: _objects, onAssetClick }: RoomLayoutViewProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "working":
        return "bg-green-400";
      case "faulty":
      case "broken":
        return "bg-red-400";
      case "pending":
        return "bg-yellow-400";
      default:
        return "bg-gray-300";
    }
  };

  const getTypeColor = (type: string | null) => {
    if (!type) return "bg-gray-100";
    return TYPE_COLORS[type] || "bg-gray-200";
  };

  const occupiedCells = new Set<string>();
  
  // Build occupied cells from new layout.assets structure
  if (layout.assets) {
    Object.entries(layout.assets).forEach(([type, assets]: [string, any]) => {
      (assets as any[]).forEach((asset: any) => {
        const width = ASSET_SIZES[type as keyof typeof ASSET_SIZES]?.width || 1;
        const height = ASSET_SIZES[type as keyof typeof ASSET_SIZES]?.height || 1;
        for (let r = asset.row; r < asset.row + height; r++) {
          for (let c = asset.col; c < asset.col + width; c++) {
            occupiedCells.add(`${r}-${c}`);
          }
        }
      });
    });
  }

  return (
    <div className="overflow-auto p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-center">
        <div
          className="inline-grid"
          style={{
            gridTemplateColumns: `repeat(${layout.gridCols}, 32px)`,
            gridTemplateRows: `repeat(${layout.gridRows}, 32px)`,
            gap: '4px'
          }}
        >
        {/* Render empty grid cells first as background */}
        {Array(layout.gridRows)
          .fill(null)
          .map((_, rowIndex) =>
            Array(layout.gridCols)
              .fill(null)
              .map((_, colIndex) => {
                // Check if this cell is occupied by any asset
                const isOccupied = occupiedCells.has(`${rowIndex}-${colIndex}`);

                if (isOccupied) {
                  return null; // Skip rendering, asset will be rendered on top
                }

                return (
                  <div
                    key={`empty-${rowIndex}-${colIndex}`}
                    style={{
                      gridColumn: colIndex + 1,
                      gridRow: rowIndex + 1
                    }}
                    className="bg-white border border-gray-200"
                  />
                );
              })
          )}

        {/* Render assets on top, spanning their width/height */}
        {layout.assets &&
          Object.entries(layout.assets).map(([type, assets]: [string, any]) =>
            (assets as any[]).map((asset: any) => {
              const width = ASSET_SIZES[type as keyof typeof ASSET_SIZES]?.width || 1;
              const height = ASSET_SIZES[type as keyof typeof ASSET_SIZES]?.height || 1;
              const objectNumber = `${type}-${asset.number}`;

              return (
                <div
                  key={`asset-${type}-${asset.number}`}
                  style={{
                    gridColumn: `${asset.col + 1} / span ${width}`,
                    gridRow: `${asset.row + 1} / span ${height}`
                  }}
                  className={`relative border border-gray-400 ${getTypeColor(type)} ${onAssetClick ? "cursor-pointer hover:opacity-80" : ""}`}
                  onClick={() => onAssetClick && onAssetClick(objectNumber)}
                  title={`${type} ${objectNumber} - ${asset.status || "working"}`}
                >
                  <span className={`absolute top-1 right-1 w-3 h-3 rounded-full ${getStatusColor(asset.status || "working")}`} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomLayoutView;
