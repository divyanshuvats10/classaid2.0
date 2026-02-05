import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import RoomLayoutView from "../components/RoomLayoutView";
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
      await api.delete(
        `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects/${objectNumber}`
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
    return "bg-red-500";
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
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition border-2 border-gray-200"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-800 capitalize">{obj.type}</h3>
          <p className="text-sm text-gray-600">{obj.objectNumber}</p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => handleDelete(obj.objectNumber)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        )}
      </div>
      <div className="flex items-center space-x-2 mb-3">
        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getStatusColor(obj.status)}`}>
          {obj.status.toUpperCase()}
        </span>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <button
            onClick={() => navigate(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms`)}
            className="text-purple-600 hover:underline mb-4"
          >
            ← Back to Rooms
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Room {roomNumber} - Assets</h1>
          {user?.role === "admin" && (
            <button
              onClick={() =>
                navigate(
                  `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/layout-editor`
                )
              }
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Edit Layout & Assets
            </button>
          )}
        </div>

        {/* Layout View */}
        {layout && layout.layoutType !== "none" && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Room Layout Overview</h2>
            <RoomLayoutView layout={layout} objects={objects} />
          </div>
        )}

        {/* Assets by Type */}
        <div className="space-y-6">
          {Object.entries(grouped)
            .filter(([_, items]) => items.length > 0)
            .map(([type, items]) => (
              <div key={type} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 capitalize">{type}s ({items.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(renderObjectCard)}
                </div>
              </div>
            ))}

          {objects.length === 0 && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No assets added yet.</p>
              {user?.role === "admin" && (
                <button
                  onClick={() =>
                    navigate(
                      `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/layout-editor`
                    )
                  }
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
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
