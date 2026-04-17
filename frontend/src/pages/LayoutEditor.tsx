import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { Layout, ObjectType, User } from "../types";
import { getAssetSize } from "../utils/assetSizes";

const LayoutEditor = () => {
  const { buildingNumber, floorNumber, roomNumber } = useParams<{
    buildingNumber: string;
    floorNumber: string;
    roomNumber: string;
  }>();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const [_user, _setUser] = useState<User | null>(null);
  const [gridRows, setGridRows] = useState(14);
  const [gridCols, setGridCols] = useState(22);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalFormData, setModalFormData] = useState({
    objectNumber: "",
    type: "board" as ObjectType["type"],
    status: "working" as ObjectType["status"]
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await api.get("/dashboard");
        _setUser(userResponse.data.user);
        const [layoutResponse, objectsResponse] = await Promise.all([
          api.get(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/layout`).catch(() => null),
          api.get(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`)
        ]);
        if (layoutResponse?.data) {
          setLayout(layoutResponse.data);
          setGridRows(layoutResponse.data.gridRows);
          setGridCols(layoutResponse.data.gridCols);
        } else {
          setLayout({
            layoutType: "custom",
            gridRows: 14,
            gridCols: 22,
            positions: []
          });
        }
        setObjects(objectsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (buildingNumber && floorNumber && roomNumber) {
      fetchData();
    }
  }, [buildingNumber, floorNumber, roomNumber]);

  const handleCellClick = (row: number, col: number) => {
    if (!layout) return;
    
    const existingPosition = layout.positions?.find((p) => p.row === row && p.col === col);
    
    if (existingPosition) {
      // Edit existing asset
      const asset = objects.find((obj) => obj.objectNumber === existingPosition.objectNumber);
      if (asset) {
        setModalFormData({
          objectNumber: asset.objectNumber,
          type: asset.type,
          status: asset.status
        });
      }
    } else {
      // Add new asset - reset form
      setModalFormData({
        objectNumber: "",
        type: "board",
        status: "working"
      });
    }
    setSelectedCell({ row, col });
    setShowModal(true);
  };

  const handleModalSave = async () => {
    if (!selectedCell || !modalFormData.objectNumber) {
      alert("Please enter an asset number");
      return;
    }

    try {

      const existingAsset = objects.find((obj) => obj.objectNumber === modalFormData.objectNumber);
      const assetSize = getAssetSize(modalFormData.type);

      // Check if placement is valid (doesn't overlap with other assets)
      if (layout) {
        for (let r = selectedCell.row; r < selectedCell.row + assetSize.height; r++) {
          for (let c = selectedCell.col; c < selectedCell.col + assetSize.width; c++) {
            const occupied = layout.positions?.find(
              (p) => p.row === r && p.col === c && p.objectNumber !== existingAsset?.objectNumber
            );
            if (occupied) {
              alert(`Cannot place asset here - overlaps with ${occupied.objectNumber}`);
              return;
            }
          }
        }
      }

      if (!existingAsset) {
        // Create new asset
        await api.post(
          `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`,
          {
            objectNumber: modalFormData.objectNumber,
            type: modalFormData.type,
            status: modalFormData.status
          }
        );
      } else {
        // Update existing asset
        await api.patch(
          `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects/${modalFormData.objectNumber}`,
          {
            type: modalFormData.type,
            status: modalFormData.status
          }
        );
      }

      // Update layout position with size info
      if (layout) {
        let newPositions = (layout.positions || []).filter(
          (p) => !(p.row === selectedCell.row && p.col === selectedCell.col)
        );
        newPositions.push({
          row: selectedCell.row,
          col: selectedCell.col,
          objectNumber: modalFormData.objectNumber,
          width: assetSize.width,
          height: assetSize.height
        });

        setLayout({
          ...layout,
          positions: newPositions
        });
      }

      // Refresh objects
      const response = await api.get(
        `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`
      );
      setObjects(response.data);

      setShowModal(false);
      setSelectedCell(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error saving asset");
    }
  };

  const handleModalDelete = async () => {
    if (!selectedCell) return;

    const position = layout?.positions?.find(
      (p) => p.row === selectedCell.row && p.col === selectedCell.col
    );
    if (!position) return;

    if (!window.confirm(`Delete asset ${position.objectNumber}?`)) return;

    try {
      await api.delete(
        `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects/${position.objectNumber}`
      );

      if (layout) {
        setLayout({
          ...layout,
          positions: (layout.positions || []).filter(
            (p) => !(p.row === selectedCell.row && p.col === selectedCell.col)
          )
        });
      }

      const response = await api.get(
        `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`
      );
      setObjects(response.data);

      setShowModal(false);
      setSelectedCell(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error deleting asset");
    }
  };

  const handleSave = async () => {
    if (!layout) return;
    try {
      await api.patch(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/layout`, {
        layout: {
          ...layout,
          gridRows,
          gridCols
        }
      });
      alert("Layout saved successfully!");
      navigate(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error saving layout");
    }
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

  if (!layout) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <button
            onClick={() => navigate(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`)}
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Grid Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Rows</label>
              <input
                type="number"
                min="5"
                max="50"
                value={gridRows}
                onChange={(e) => {
                  const rows = parseInt(e.target.value) || 20;
                  setGridRows(rows);
                  setLayout({ ...layout, gridRows: rows });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Columns</label>
              <input
                type="number"
                min="5"
                max="50"
                value={gridCols}
                onChange={(e) => {
                  const cols = parseInt(e.target.value) || 20;
                  setGridCols(cols);
                  setLayout({ ...layout, gridCols: cols });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Room Layout Grid</h2>
          <p className="text-gray-600 mb-4">Click on any cell to add or edit an asset</p>
          <div className="overflow-auto p-4 bg-gray-50 rounded-lg">
            <div
              className="inline-grid"
              style={{
                gridTemplateColumns: `repeat(${gridCols}, 32px)`,
                gridTemplateRows: `repeat(${gridRows}, 32px)`,
                gap: '4px'
              }}
            >
              {/* Render empty grid cells first as background */}
              {Array(gridRows)
                .fill(null)
                .map((_, rowIndex) =>
                  Array(gridCols)
                    .fill(null)
                    .map((_, colIndex) => {
                      // Check if this cell is occupied by any asset
                      const isOccupied = layout?.positions?.some((p) => {
                        const width = p.width || getAssetSize(objects.find((obj) => obj.objectNumber === p.objectNumber)?.type || "table").width;
                        const height = p.height || getAssetSize(objects.find((obj) => obj.objectNumber === p.objectNumber)?.type || "table").height;
                        return (
                          colIndex >= p.col &&
                          colIndex < p.col + width &&
                          rowIndex >= p.row &&
                          rowIndex < p.row + height
                        );
                      });

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
                          className="bg-white border border-gray-200 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        />
                      );
                    })
                )}

              {/* Render assets on top, spanning their width/height */}
              {layout?.positions?.map((position) => {
                const asset = objects.find((obj) => obj.objectNumber === position.objectNumber);
                const width = position.width || getAssetSize(asset?.type || "table").width;
                const height = position.height || getAssetSize(asset?.type || "table").height;
                const type = asset?.type || "table";

                return (
                  <div
                    key={`asset-${position.row}-${position.col}`}
                    style={{
                      gridColumn: `${position.col + 1} / span ${width}`,
                      gridRow: `${position.row + 1} / span ${height}`
                    }}
                    className={`border-2 cursor-pointer transition ${getTypeColor(type)} border-gray-600 ${
                      asset?.status === "faulty"
                        ? "opacity-50"
                        : asset?.status === "pending"
                        ? "opacity-75"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedCell({ row: position.row, col: position.col });
                      setModalFormData({
                        objectNumber: asset?.objectNumber || "",
                        type: asset?.type || "board",
                        status: asset?.status || "working"
                      });
                      setShowModal(true);
                    }}
                    title={`${asset?.objectNumber || ""} (${width}x${height})`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Assets Sidebar */}
        {layout && (layout.positions?.length || 0) > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Assets in Layout ({layout.positions?.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {layout.positions?.map((position) => {
                const asset = objects.find((obj) => obj.objectNumber === position.objectNumber);
                if (!asset) return null;

                return (
                  <div
                    key={position.objectNumber}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${getTypeColor(
                      asset.type
                    )} border-gray-400 hover:shadow-md`}
                    onClick={() => {
                      setSelectedCell({ row: position.row, col: position.col });
                      setModalFormData({
                        objectNumber: asset.objectNumber,
                        type: asset.type,
                        status: asset.status
                      });
                      setShowModal(true);
                    }}
                  >
                    <h3 className="font-semibold text-gray-800">{asset.objectNumber}</h3>
                    <p className="text-sm text-gray-600 capitalize">{asset.type}</p>
                    <p className="text-sm text-gray-600">
                      Position: ({position.row}, {position.col})
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

        {/* Asset Modal */}
        {showModal && selectedCell && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">
                {layout?.positions?.find((p) => p.row === selectedCell.row && p.col === selectedCell.col)
                  ? "Edit Asset"
                  : "Add Asset"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Asset Number</label>
                  <input
                    type="text"
                    value={modalFormData.objectNumber}
                    onChange={(e) =>
                      setModalFormData({ ...modalFormData, objectNumber: e.target.value })
                    }
                    placeholder="e.g., board-1, ac-2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Type</label>
                  <select
                    value={modalFormData.type}
                    onChange={(e) =>
                      setModalFormData({
                        ...modalFormData,
                        type: e.target.value as ObjectType["type"]
                      })
                    }
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
                    Size: {getAssetSize(modalFormData.type).width}x{getAssetSize(modalFormData.type).height}
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
                        status: e.target.value as ObjectType["status"]
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
                {layout?.positions?.find((p) => p.row === selectedCell.row && p.col === selectedCell.col) && (
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
      </div>
    </div>
  );
};

export default LayoutEditor;
