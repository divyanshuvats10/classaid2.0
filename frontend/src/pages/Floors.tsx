import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { Floor, User } from "../types";

const Floors = () => {
  const { buildingNumber } = useParams<{ buildingNumber: string }>();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState("");
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const sortedAndFilteredFloors = useMemo(() => {
    const arr = [...floors].sort((a, b) => {
      const na = Number(a.floorNumber);
      const nb = Number(b.floorNumber);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a.floorNumber).localeCompare(String(b.floorNumber));
    });
    if (!searchQuery) return arr;
    const q = searchQuery.toLowerCase();
    return arr.filter((f) => String(f.floorNumber).toLowerCase().includes(q));
  }, [floors, searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await api.get("/dashboard");
        setUser(userResponse.data.user);
        const floorsResponse = await api.get(`/buildings/${buildingNumber}/floors`);
        setFloors(floorsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (buildingNumber) {
      fetchData();
    }
  }, [buildingNumber]);

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/buildings/${buildingNumber}/floors`, { floorNumber: newFloorNumber });
      setNewFloorNumber("");
      setShowAddForm(false);
      const response = await api.get(`/buildings/${buildingNumber}/floors`);
      setFloors(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error adding floor");
    }
  };

  const handleDelete = async (floorNumber: string) => {
    if (!window.confirm("Are you sure you want to delete this floor?")) return;
    try {
      await api.delete(`/buildings/${buildingNumber}/floors/${floorNumber}`);
      const response = await api.get(`/buildings/${buildingNumber}/floors`);
      setFloors(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error deleting floor");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <button onClick={() => navigate("/buildings")} className="text-purple-600 hover:underline mb-4">
            ← Back to Blocks
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Floors - Block {buildingNumber}</h1>
          {user?.role === "admin" && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              {showAddForm ? "Cancel" : "Add Floor"}
            </button>
          )}
        </div>

        {showAddForm && user?.role === "admin" && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Add New Floor</h2>
            <form onSubmit={handleAddFloor} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Floor Number</label>
                <input
                  type="text"
                  value={newFloorNumber}
                  onChange={(e) => setNewFloorNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                Add Floor
              </button>
            </form>
          </div>
        )}

        <div className="flex">
          <aside className="w-64 mr-6 hidden md:block">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-bold mb-3">Search Floors</h3>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by floor number"
                  className="w-full pl-3 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 w-6 h-6 flex items-center justify-center"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {sortedAndFilteredFloors.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <p className="text-gray-500">No floors found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAndFilteredFloors.map((floor) => (
                  <div key={floor.floorNumber} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Floor {floor.floorNumber}</h2>
                        <p className="text-gray-600">{floor.rooms.length} room(s)</p>
                      </div>
                      {user?.role === "admin" && (
                        <button
                          onClick={() => handleDelete(floor.floorNumber)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <Link
                      to={`/buildings/${buildingNumber}/floors/${floor.floorNumber}/rooms`}
                      className="block bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
                    >
                      View Rooms
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Floors;

