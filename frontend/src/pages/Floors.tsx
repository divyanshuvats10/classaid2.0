import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { Floor, User } from "../types";

const Floors = () => {
  const { buildingNumber } = useParams<{ buildingNumber: string }>();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState("");
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
    <div className="min-h-screen bg-[#fef7ed]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="card mb-8 bg-[#fff4e5] border-0 shadow-2xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black text-orange-700">Floors</h1>
              <p className="mt-3 text-gray-600">Manage floors in Block {buildingNumber} with bold cards, search, and a crisp add-flow.</p>
            </div>
            {user?.role === "admin" && (
              <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
                {showAddForm ? "Cancel" : "Add Floor"}
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-6">
            <div className="card p-6 border-2 border-orange-200 bg-white/95">
              <h3 className="text-xl font-bold text-orange-600 mb-4">Search Floors</h3>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by floor number"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {showAddForm && user?.role === "admin" && (
              <div className="card p-6 border-2 border-orange-200 bg-white/95">
                <h2 className="text-xl font-bold mb-4">Add New Floor</h2>
                <form onSubmit={handleAddFloor} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Floor Number</label>
                    <input
                      type="text"
                      value={newFloorNumber}
                      onChange={(e) => setNewFloorNumber(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">
                    Add Floor
                  </button>
                </form>
              </div>
            )}
          </aside>

          <main className="space-y-6">
            {sortedAndFilteredFloors.length === 0 ? (
              <div className="card p-10 border-2 border-orange-200 bg-white/95 text-center">
                <p className="text-gray-600">No floors found</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {sortedAndFilteredFloors.map((floor) => (
                  <div
                    key={floor.floorNumber}
                    className="card flex min-h-[200px] flex-col justify-between border-2 border-orange-200 bg-white/95 p-6 shadow-lg transition hover:-translate-y-1"
                  >
                    <div className="space-y-3">
                      <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                        Floor
                      </span>
                      <h2 className="text-3xl font-black text-gray-900">{floor.floorNumber}</h2>
                      <p className="text-sm text-gray-600">{floor.rooms.length} room{floor.rooms.length === 1 ? "" : "s"}</p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <Link to={`/buildings/${buildingNumber}/floors/${floor.floorNumber}/rooms`} className="btn-outline text-center">
                        View Rooms
                      </Link>
                      {user?.role === "admin" && (
                        <button type="button" onClick={() => handleDelete(floor.floorNumber)} className="btn-secondary">
                          Delete Floor
                        </button>
                      )}
                    </div>
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

