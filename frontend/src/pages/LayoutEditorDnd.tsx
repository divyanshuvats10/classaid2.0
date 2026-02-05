import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { Layout, AssetObject, User } from "../types";
import { getAssetSize } from "../utils/assetSizes";
import { getRoom101Layout } from "../utils/layouts/room101Layout";

const ASSET_TYPES: Array<"board" | "projector" | "ac" | "fan" | "table" | "chair" | "tablechair" | "door"> = [
  "board",
  "projector",
  "ac",
  "fan",
  "table",
  "chair",
  "tablechair",
  "door"
];

interface DraggedAssetState {
  type: string;
  number: number;
}

const LayoutEditorDnd = () => {
  const { buildingNumber, floorNumber, roomNumber } = useParams<{
    buildingNumber: string;
    floorNumber: string;
    roomNumber: string;
  }>();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [currentLayout, setCurrentLayout] = useState<Layout | null>(null);
  const [viewingLayoutType, setViewingLayoutType] = useState<"current" | "layout1">("current");
  const [_user, _setUser] = useState<User | null>(null);
  const [gridRows, setGridRows] = useState(14);
  const [gridCols, setGridCols] = useState(22);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [draggedAsset, setDraggedAsset] = useState<DraggedAssetState | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalFormData, setModalFormData] = useState({
    number: 0,
    type: "board" as any,
    status: "working" as "working" | "faulty" | "pending" | "broken"
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);
  const navigate = useNavigate();

  // Helper: Get all assets flattened into a single array with type info
  const getAllAssets = (): Array<AssetObject & { type: string }> => {
    if (!layout?.assets) return [];
    const all: Array<AssetObject & { type: string }> = [];
    Object.entries(layout.assets).forEach(([type, assets]: [string, any]) => {
      (assets as AssetObject[]).forEach((asset: AssetObject) => {
        all.push({ ...asset, type });
      });
    });
    return all;
  };

  // Helper: Get asset at a specific cell
  const getAssetAtCell = (row: number, col: number): (AssetObject & { type: string }) | undefined => {
    const allAssets = getAllAssets();
    return allAssets.find((asset) => {
      const size = getAssetSize(asset.type as any);
      return col >= asset.col && col < asset.col + size.width && row >= asset.row && row < asset.row + size.height;
    });
  };

  // Helper: Check if cell is occupiable (part of an asset)
  const isCellOccupied = (row: number, col: number): boolean => {
    return !!getAssetAtCell(row, col);
  };

  const getNextAssetNumber = (type: string) => {
    const typeAssets = (layout?.assets?.[type as keyof typeof layout.assets] as AssetObject[]) || [];
    const numbers = typeAssets.map((asset) => asset.number).filter((n) => !isNaN(n));
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    return maxNumber + 1;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await api.get("/dashboard");
        _setUser(userResponse.data.user);
        const layoutResponse = await api
          .get(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/layout`)
          .catch(() => null);

        if (layoutResponse?.data) {
          setLayout(layoutResponse.data);
          setCurrentLayout(layoutResponse.data);
          setGridRows(layoutResponse.data.gridRows);
          setGridCols(layoutResponse.data.gridCols);
        } else {
          const emptyLayout = {
            layoutType: "custom" as const,
            gridRows: 14,
            gridCols: 22,
            assets: {
              board: [],
              projector: [],
              ac: [],
              fan: [],
              table: [],
              chair: [],
              tablechair: [],
              door: []
            }
          };
          setLayout(emptyLayout);
          setCurrentLayout(emptyLayout);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (buildingNumber && floorNumber && roomNumber) {
      fetchData();
    }
  }, [buildingNumber, floorNumber, roomNumber]);

  const handleDragStartAssetType = (e: React.DragEvent, type: string) => {
    setDraggedType(type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragStartAsset = (e: React.DragEvent, type: string, number: number) => {
    setDraggedAsset({ type, number });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedType ? "copy" : "move";
  };

  const handleDropOnGrid = async (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    if (!layout || (!draggedType && !draggedAsset)) return;

    if (draggedAsset) {
      // Moving existing asset
      const typeAssets = (layout.assets?.[draggedAsset.type as keyof typeof layout.assets] as AssetObject[]) || [];
      const draggedObj = typeAssets.find((a) => a.number === draggedAsset.number);

      if (!draggedObj) {
        alert("Asset not found");
        setDraggedAsset(null);
        return;
      }

      const size = getAssetSize(draggedAsset.type as any);

      // Check bounds
      if (col + size.width > gridCols || row + size.height > gridRows) {
        alert("Asset does not fit");
        setDraggedAsset(null);
        return;
      }

      // Check overlap with other assets
      for (let r = row; r < row + size.height; r++) {
        for (let c = col; c < col + size.width; c++) {
          const occupant = getAssetAtCell(r, c);
          if (occupant && (occupant.type !== draggedAsset.type || occupant.number !== draggedAsset.number)) {
            alert("Cannot place asset here - overlaps with another asset");
            setDraggedAsset(null);
            return;
          }
        }
      }

      // Update position
      if (layout.assets) {
        const newAssets = { ...layout.assets };
        const idx = typeAssets.findIndex((a) => a.number === draggedAsset.number);
        if (idx !== -1) {
          typeAssets[idx] = { ...typeAssets[idx], row, col };
          newAssets[draggedAsset.type as keyof typeof layout.assets] = [...typeAssets];
          setLayout({ ...layout, assets: newAssets });
        }
      }
      setDraggedAsset(null);
    } else if (draggedType) {
      // Adding new asset
      const size = getAssetSize(draggedType as any);

      // Check if new asset fits
      if (col + size.width > gridCols || row + size.height > gridRows) {
        alert("Asset does not fit in the remaining space");
        setDraggedType(null);
        return;
      }

      // Check overlap
      for (let r = row; r < row + size.height; r++) {
        for (let c = col; c < col + size.width; c++) {
          if (isCellOccupied(r, c)) {
            alert("Cannot place asset here - overlaps with another asset");
            setDraggedType(null);
            return;
          }
        }
      }

      // Open modal to configure the new asset
      setSelectedCell({ row, col });
      setModalFormData({
        number: getNextAssetNumber(draggedType),
        type: draggedType,
        status: "working"
      });
      setShowModal(true);
      setDraggedType(null);
    }
  };

  const handleModalSave = () => {
    if (!selectedCell || modalFormData.number === undefined) {
      alert("Please enter a valid asset number");
      return;
    }

    if (!layout?.assets) return;

    const type = modalFormData.type;
    const number = modalFormData.number;
    const typeAssets = (layout.assets[type as keyof typeof layout.assets] as AssetObject[]) || [];
    const existingAssetIndex = typeAssets.findIndex((a) => a.number === number);

    // Update layout state locally
    const newAssets = { ...layout.assets };
    const newTypeAssets = [...typeAssets];

    if (existingAssetIndex >= 0) {
      // Update existing asset
      newTypeAssets[existingAssetIndex] = {
        ...newTypeAssets[existingAssetIndex],
        row: selectedCell.row,
        col: selectedCell.col,
        status: modalFormData.status
      };
    } else {
      // Add new asset
      newTypeAssets.push({
        number: number,
        row: selectedCell.row,
        col: selectedCell.col,
        status: modalFormData.status
      });
    }

    newAssets[type as keyof typeof layout.assets] = newTypeAssets;
    setLayout({ ...layout, assets: newAssets });

    setShowModal(false);
    setSelectedCell(null);
  };

  const handleModalDelete = () => {
    if (!selectedCell) return;

    const asset = getAssetAtCell(selectedCell.row, selectedCell.col);
    if (!asset) return;

    if (!window.confirm(`Delete ${asset.type}-${asset.number}?`)) return;

    if (!layout?.assets) return;

    // Remove asset from layout state locally
    const newAssets = { ...layout.assets };
    const typeAssets = (newAssets[asset.type as keyof typeof layout.assets] as AssetObject[]) || [];
    newAssets[asset.type as keyof typeof layout.assets] = typeAssets.filter(
      (a) => a.number !== asset.number
    );

    setLayout({ ...layout, assets: newAssets });
    setShowModal(false);
    setSelectedCell(null);
  };

  const handleSave = async () => {
    if (!layout) return;
    try {
      await api.patch(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/layout`, {
        layout: {
          layoutType: layout.layoutType,
          gridRows: gridRows,
          gridCols: gridCols,
          assets: layout.assets
        }
      });
      setCurrentLayout(layout);
      alert("Layout saved successfully!");
      navigate(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error saving layout");
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !layout) {
      alert("Please enter a template name and ensure a layout is loaded");
      return;
    }
    try {
      setTemplateSaving(true);
      await api.post(`/layout-templates`, { templateName, layout });
      setTemplateSaving(false);
      setShowTemplateModal(false);
      setTemplateName("");
      alert("Template saved successfully!");
    } catch (error: any) {
      setTemplateSaving(false);
      alert(error.response?.data?.message || "Error saving template");
    }
  };

  const handleLayoutTypeChange = (type: "current" | "layout1") => {
    if (type === "current" && currentLayout) {
      setLayout(currentLayout);
      setGridRows(currentLayout.gridRows);
      setGridCols(currentLayout.gridCols);
    } else if (type === "layout1") {
      const layout1 = getRoom101Layout();
      setLayout(layout1);
      setGridRows(layout1.gridRows);
      setGridCols(layout1.gridCols);
    }
    setViewingLayoutType(type);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "board":
        return "bg-blue-200";
      case "projector":
        return "bg-purple-200";
      case "ac":
        return "bg-cyan-200";
      case "fan":
        return "bg-green-200";
      case "table":
        return "bg-amber-200";
      case "chair":
        return "bg-orange-200";
      case "tablechair":
        return "bg-rose-200";
      case "door":
        return "bg-amber-700";
      default:
        return "bg-gray-200";
    }
  };

  const allAssets = getAllAssets();

  if (!layout) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <button
            onClick={() =>
              navigate(
                `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`
              )
            }
            className="text-purple-600 hover:underline mb-4"
          >
            ← Back to Assets
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Layout Editor</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Save Layout
            </button>
            {_user?.role === "admin" && (
              <>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Save as Template
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Asset Palette */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-4">Drag Assets</h2>
              <p className="text-gray-600 text-sm mb-4">Drag asset types onto the grid to place them</p>
              <div className="space-y-2">
                {ASSET_TYPES.map((type) => {
                  const size = getAssetSize(type);
                  return (
                    <div
                      key={type}
                      draggable
                      onDragStart={(e) => handleDragStartAssetType(e, type)}
                      className={`p-3 rounded-lg cursor-move hover:shadow-md transition border-2 border-gray-300 ${getTypeColor(
                        type
                      )}`}
                    >
                      <p className="font-semibold capitalize">{type}</p>
                      <p className={`text-xs ${type === "door" ? "text-gray-900" : "text-gray-600"}`}>
                        {size.width}x{size.height}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Layout Selector */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">View Layout</h3>
                <select
                  value={viewingLayoutType}
                  onChange={(e) =>
                    handleLayoutTypeChange(e.target.value as "current" | "layout1")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="current">Current Layout</option>
                  <option value="layout1">Layout 1 (Template)</option>
                </select>
                {viewingLayoutType === "layout1" && (
                  <p className="text-xs text-gray-600 mt-2 italic">
                    ℹ️ Viewing template. Switch to "Current Layout" to edit.
                  </p>
                )}
              </div>

              {/* Grid Settings */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4">Grid Size</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Rows: {gridRows}</label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={gridRows}
                      onChange={(e) => {
                        const rows = parseInt(e.target.value) || 14;
                        setGridRows(rows);
                        setLayout({ ...layout, gridRows: rows });
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Cols: {gridCols}</label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={gridCols}
                      onChange={(e) => {
                        const cols = parseInt(e.target.value) || 22;
                        setGridCols(cols);
                        setLayout({ ...layout, gridCols: cols });
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Main Grid + Asset List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Grid */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Room Layout</h2>
              <div className="overflow-auto p-4 bg-gray-50 rounded-lg">
                <div
                  className="inline-grid"
                  style={{
                    gridTemplateColumns: `repeat(${gridCols}, 32px)`,
                    gridTemplateRows: `repeat(${gridRows}, 32px)`,
                    gap: "4px"
                  }}
                >
                  {/* Empty cells */}
                  {Array(gridRows)
                    .fill(null)
                    .map((_, rowIndex) =>
                      Array(gridCols)
                        .fill(null)
                        .map((_, colIndex) => {
                          if (isCellOccupied(rowIndex, colIndex)) return null;

                          return (
                            <div
                              key={`empty-${rowIndex}-${colIndex}`}
                              style={{
                                gridColumn: colIndex + 1,
                                gridRow: rowIndex + 1
                              }}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDropOnGrid(e, rowIndex, colIndex)}
                              className="bg-white border border-gray-200 cursor-pointer hover:bg-gray-50"
                            />
                          );
                        })
                    )}

                  {/* Assets */}
                  {allAssets.map((asset) => {
                    const size = getAssetSize(asset.type as any);
                    const isSelected =
                      selectedCell?.row === asset.row && selectedCell?.col === asset.col;

                    return (
                      <div
                        key={`asset-${asset.type}-${asset.number}`}
                        draggable
                        onDragStart={(e) => handleDragStartAsset(e, asset.type, asset.number)}
                        style={{
                          gridColumn: `${asset.col + 1} / span ${size.width}`,
                          gridRow: `${asset.row + 1} / span ${size.height}`
                        }}
                        className={`border-2 cursor-move hover:shadow-md transition ${getTypeColor(
                          asset.type
                        )} border-gray-600 ${
                          asset.status === "faulty" || asset.status === "broken"
                            ? "opacity-50"
                            : asset.status === "pending"
                            ? "opacity-75"
                            : ""
                        } ${isSelected ? "ring-2 ring-red-500" : ""}`}
                        onClick={() => {
                          setSelectedCell({ row: asset.row, col: asset.col });
                          setModalFormData({
                            number: asset.number,
                            type: asset.type,
                            status: asset.status
                          });
                          setShowModal(true);
                        }}
                        title={`${asset.type}-${asset.number} - drag to move, click to edit`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Assets List */}
            {allAssets.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Assets in Layout ({allAssets.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {allAssets.map((asset) => {
                    const size = getAssetSize(asset.type as any);
                    return (
                      <div
                        key={`card-${asset.type}-${asset.number}`}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition ${getTypeColor(
                          asset.type
                        )} border-gray-400 hover:shadow-md`}
                        onClick={() => {
                          setSelectedCell({ row: asset.row, col: asset.col });
                          setModalFormData({
                            number: asset.number,
                            type: asset.type,
                            status: asset.status
                          });
                          setShowModal(true);
                        }}
                      >
                        <h3 className="font-semibold text-gray-800">
                          {asset.type}-{asset.number}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">{asset.type}</p>
                        <p className="text-xs text-gray-600">
                          ({asset.row}, {asset.col}) • {size.width}x{size.height}
                        </p>
                        <span
                          className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold text-white ${
                            asset.status === "working"
                              ? "bg-green-500"
                              : asset.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        >
                          {asset.status.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedCell && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">
                {getAssetAtCell(selectedCell.row, selectedCell.col) ? "Edit Asset" : "Add Asset"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Asset Number</label>
                  <div className="flex items-center">
                    <span className="text-gray-700 font-semibold px-3 py-2 bg-gray-100 rounded-l-lg border border-r-0 border-gray-300">
                      {modalFormData.type}-
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={modalFormData.number}
                      onChange={(e) => {
                        setModalFormData({
                          ...modalFormData,
                          number: parseInt(e.target.value) || 0
                        });
                      }}
                      placeholder="1"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Type</label>
                  <select
                    value={modalFormData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setModalFormData({
                        ...modalFormData,
                        type: newType,
                        number: getNextAssetNumber(newType)
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="board">Board (2x1)</option>
                    <option value="projector">Projector (2x1)</option>
                    <option value="ac">AC (1x2)</option>
                    <option value="fan">Fan (2x2)</option>
                    <option value="table">Table (1x1)</option>
                    <option value="chair">Chair (1x1)</option>
                    <option value="tablechair">Table + Chair (1x1)</option>
                    <option value="door">Door (1x2)</option>
                  </select>
                </div>
                <div className="bg-blue-50 p-3 rounded text-sm text-gray-700">
                  <p className="font-semibold">
                    Size: {getAssetSize(modalFormData.type as any).width}x
                    {getAssetSize(modalFormData.type as any).height}
                  </p>
                  <p className="text-gray-600">
                    Position: ({selectedCell.row}, {selectedCell.col})
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Status</label>
                  <select
                    value={modalFormData.status}
                    onChange={(e) =>
                      setModalFormData({
                        ...modalFormData,
                        status: e.target.value as "working" | "faulty" | "pending"
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="working">Working</option>
                    <option value="pending">Pending</option>
                    <option value="faulty">Faulty</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleModalSave}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Save
                </button>
                {getAssetAtCell(selectedCell.row, selectedCell.col) && (
                  <button
                    onClick={handleModalDelete}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCell(null);
                  }}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">Save Layout as Template</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., layout1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  This will save the current layout (grid size and asset positions) into the templates collection.
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSaveTemplate}
                  disabled={templateSaving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {templateSaving ? "Saving..." : "Save Template"}
                </button>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setTemplateName("");
                  }}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutEditorDnd;
