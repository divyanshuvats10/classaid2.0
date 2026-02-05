import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { Building, User } from "../types";

const Buildings = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ buildingNumber: "", buildingName: "" });


  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await api.get("/dashboard");
        setUser(userResponse.data.user);
        const buildingsResponse = await api.get("/buildings");
        setBuildings(buildingsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        buildingNumber: newBuilding.buildingNumber,
        ...(newBuilding.buildingName && { buildingName: newBuilding.buildingName })
      };
      await api.post("/buildings", payload);
      setNewBuilding({ buildingNumber: "", buildingName: "" });
      setShowAddForm(false);
      const response = await api.get("/buildings");
      setBuildings(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error adding block");
    }
  };

  const handleDelete = async (buildingNumber: string) => {
    if (!window.confirm("Are you sure you want to delete this block?")) return;
    try {
      await api.delete(`/buildings/${buildingNumber}`);
      const response = await api.get("/buildings");
      setBuildings(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error deleting block");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Blocks</h1>
          {user?.role === "admin" && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              {showAddForm ? "Cancel" : "Add Block"}
            </button>
          )}
        </div>

        {showAddForm && user?.role === "admin" && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Add New Block</h2>
            <form onSubmit={handleAddBuilding} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Block Number (1-60)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={newBuilding.buildingNumber}
                  onChange={(e) => setNewBuilding({ ...newBuilding, buildingNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Block Name (Optional)</label>
                <input
                  type="text"
                  value={newBuilding.buildingName}
                  onChange={(e) => setNewBuilding({ ...newBuilding, buildingName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Science Block"
                />
              </div>
              <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                Add Block
              </button>
            </form>
          </div>
        )}

        {buildings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-500">No blocks found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building) => (
              <div key={building.buildingNumber} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition flex flex-col" style={{ minHeight: '180px' }}>
                <div className="flex justify-between items-start mb-4 flex-grow">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800">Block {building.buildingNumber}</h2>
                    {building.buildingName && (
                      <p className="text-gray-600 text-sm mt-1">{building.buildingName}</p>
                    )}
                    {!building.buildingName && (
                      <div className="text-sm mt-1" style={{ height: '20px' }}></div>
                    )}
                  </div>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => handleDelete(building.buildingNumber)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <Link
                  to={`/buildings/${building.buildingNumber}/floors`}
                  className="block bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition mt-auto"
                >
                  View Floors
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Buildings;

