import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import RoomLayoutView from "../components/RoomLayoutView";
import { TYPE_COLORS, TYPE_DISPLAY_NAME } from "../utils/typeColors";
import api from "../api/axios";
import { ObjectType, User, Layout } from "../types";

const RoomObjects = () => {
  const { buildingNumber, floorNumber, roomNumber } = useParams<{
    buildingNumber: string;
    floorNumber: string;
    roomNumber: string;
  }>();
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await api.get("/dashboard");
        setUser(userResponse.data.user);
        const [objectsResponse, layoutResponse] = await Promise.all([
          api.get(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`),
          api.get(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/layout`).catch(() => null)
        ]);
        setObjects(objectsResponse.data);
        if (layoutResponse?.data) {
          setLayout(layoutResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (buildingNumber && floorNumber && roomNumber) {
      fetchData();
    }
  }, [buildingNumber, floorNumber, roomNumber]);

  const handleDelete = async (objectNumber: string) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      // Parse objectNumber to get type and number
      const parts = objectNumber.split("-");
      const type = parts[0];
      const number = parts[1];
      
      await api.delete(
        `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects/${type}/${number}`
      );
      const response = await api.get(
        `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`
      );
      setObjects(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error deleting asset");
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "working") return "bg-green-500";
    if (status === "pending") return "bg-yellow-500";
    if (status === "broken" || status === "faulty") return "bg-red-500";
    return "bg-gray-500";
  };

  // Group objects by type
  const grouped: Record<string, ObjectType[]> = {
    board: [],
    projector: [],
    ac: [],
    fan: [],
    table: [],
    chair: [],
    tablechair: [],
    door: []
  };
  objects.forEach((obj) => {
    if (grouped[obj.type]) {
      grouped[obj.type].push(obj);
    }
  });

  const renderObjectCard = (obj: ObjectType) => (
    <div
      key={obj.objectNumber}
      onClick={() => navigate(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects/${obj.objectNumber}/complaints`)}
      className="card complaint-card cursor-pointer hover:shadow-2xl transition"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-800 capitalize">{obj.type}</h3>
          <p className="text-sm text-gray-600">{obj.objectNumber}</p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(obj.objectNumber);
            }}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        )}
      </div>
      <div className="flex items-center space-x-2 mb-3">
        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getStatusColor(obj.status || "working")}`}>
          {(obj.status || "working").toUpperCase()}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fef7ed]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="card mb-8 bg-[#fff4e5] border-0 shadow-2xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black text-orange-700">Room {roomNumber} - Assets</h1>
              <p className="mt-3 text-gray-600">
                Browse and manage assets in this room with interactive cards, layout overview, and admin controls.
              </p>
            </div>
            {user?.role === "admin" && (
              <button
                onClick={() =>
                  navigate(
                    `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/layout-editor`
                  )
                }
                className="btn-primary"
              >
                Edit Layout & Assets
              </button>
            )}
          </div>
        </div>

        {/* Layout View */}
        {layout && layout.layoutType !== "none" && (
          <div className="card mb-8 p-6 border-2 border-orange-200 bg-white/95">
            <h2 className="text-xl font-bold mb-4">Room Layout Overview</h2>

            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
              <div className="flex flex-wrap gap-3 items-center">
                {Object.keys(TYPE_DISPLAY_NAME).map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded ${TYPE_COLORS[type] || 'bg-gray-200'} border`} />
                    <div className="text-sm text-gray-700 capitalize">{TYPE_DISPLAY_NAME[type]}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-3 mt-2 md:mt-0">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="text-sm text-gray-600">Working</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="text-sm text-gray-600">Blocked</div>
                </div>
              </div>
            </div>

            <RoomLayoutView layout={layout} objects={objects} onAssetClick={(objectNumber) => navigate(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects/${objectNumber}/complaints`)} />
          </div>
        )}

        {/* Assets by Type */}
        <div className="space-y-6">
          {Object.entries(grouped)
            .filter(([_, items]) => items.length > 0)
            .map(([type, items]) => (
              <div key={type} className="card p-6 border-2 border-orange-200 bg-white/95">
                <h2 className="text-xl font-bold mb-4 capitalize">{type}s ({items.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(renderObjectCard)}
                </div>
              </div>
            ))}

          {objects.length === 0 && (
            <div className="card p-12 border-2 border-orange-200 bg-white/95 text-center">
              <p className="text-gray-600 text-lg mb-4">No assets added yet.</p>
              {user?.role === "admin" && (
                <button
                  onClick={() =>
                    navigate(
                      `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/layout-editor`
                    )
                  }
                  className="btn-primary"
                >
                  Add Assets
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomObjects;

