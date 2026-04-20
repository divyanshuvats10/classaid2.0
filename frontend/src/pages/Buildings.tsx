import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { Building, User } from "../types";

const Buildings = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ buildingNumber: "", buildingName: "" });

  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const sortedAndFiltered = useMemo(() => {
    const arr = [...buildings].sort((a, b) => {
      const na = Number(a.buildingNumber);
      const nb = Number(b.buildingNumber);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a.buildingNumber).localeCompare(String(b.buildingNumber));
    });
    if (!searchQuery) return arr;
    const q = searchQuery.toLowerCase();
    return arr.filter((b) => {
      const numMatch = String(b.buildingNumber).toLowerCase().includes(q);
      const nameMatch = b.buildingName?.toLowerCase().includes(q);
      return numMatch || Boolean(nameMatch);
    });
  }, [buildings, searchQuery]);


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
    <div className="min-h-screen bg-[#fef7ed]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="card p-6 mb-8 bg-[#fff4e5] border-0 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black text-orange-700">Blocks</h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                Browse all blocks, search quickly, and manage the school layout with bold card-driven workflows.
              </p>
            </div>
            {user?.role === "admin" && (
              <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
                {showAddForm ? "Cancel" : "Add Block"}
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-6">
            <div className="card p-6 border-2 border-orange-200 bg-white/95">
              <h3 className="text-xl font-bold text-orange-600 mb-4">Search Blocks</h3>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by number or name"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
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
                <h2 className="text-xl font-bold mb-4">Add New Block</h2>
                <form onSubmit={handleAddBuilding} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Block Number (1-60)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={newBuilding.buildingNumber}
                      onChange={(e) => setNewBuilding({ ...newBuilding, buildingNumber: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Block Name (Optional)</label>
                    <input
                      type="text"
                      value={newBuilding.buildingName}
                      onChange={(e) => setNewBuilding({ ...newBuilding, buildingName: e.target.value })}
                      placeholder="e.g., Science Block"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">
                    Add Block
                  </button>
                </form>
              </div>
            )}
          </aside>

          <main className="space-y-6">
            {sortedAndFiltered.length === 0 ? (
              <div className="card p-10 border-2 border-orange-200 bg-white/95 text-center">
                <p className="text-gray-600">No blocks found</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {sortedAndFiltered.map((building) => (
                  <div
                    key={building.buildingNumber}
                    className="card flex min-h-[200px] flex-col justify-between border-2 border-orange-200 bg-white/95 p-6 shadow-lg transition hover:-translate-y-1"
                  >
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                        Block
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-gray-900">{building.buildingNumber}</h2>
                        {building.buildingName ? (
                          <p className="text-gray-600 mt-1">{building.buildingName}</p>
                        ) : (
                          <p className="text-gray-400 mt-1">Unnamed block</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {building.floors?.length ?? 0} floor{(building.floors?.length ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <Link
                        to={`/buildings/${building.buildingNumber}/floors`}
                        className="btn-outline text-center"
                      >
                        View Floors
                      </Link>
                      {user?.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => handleDelete(building.buildingNumber)}
                          className="btn-secondary"
                        >
                          Delete Block
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

export default Buildings;

