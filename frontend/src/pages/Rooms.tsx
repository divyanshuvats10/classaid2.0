import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { Room, User, Complaint } from "../types";

const Rooms = () => {
  const { buildingNumber, floorNumber } = useParams<{ buildingNumber: string; floorNumber: string }>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [templates, setTemplates] = useState<Array<{ templateName: string }>>([]);
  const [selectedLayout, setSelectedLayout] = useState<string>("none");
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const sortedAndFilteredRooms = useMemo(() => {
    const arr = [...rooms].sort((a, b) => {
      const na = Number(a.roomNumber);
      const nb = Number(b.roomNumber);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a.roomNumber).localeCompare(String(b.roomNumber));
    });
    if (!searchQuery) return arr;
    const q = searchQuery.toLowerCase();
    return arr.filter((r) => String(r.roomNumber).toLowerCase().includes(q));
  }, [rooms, searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await api.get("/dashboard");
        setUser(userResponse.data.user);
        const roomsResponse = await api.get(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms`);
        setRooms(roomsResponse.data);
        
        // Fetch available layout templates for the 'Add Room' form
        try {
          const templatesResp = await api.get(`/layout-templates`).catch(() => null);
          if (templatesResp?.data) {
            setTemplates(templatesResp.data);
            if (templatesResp.data.length > 0) {
              setSelectedLayout(templatesResp.data[0].templateName);
            } else {
              setSelectedLayout("none");
            }
          }
        } catch (err) {
          console.error("Error fetching templates:", err);
        }

        // Fetch complaints for admin and worker to show counts
        if (userResponse.data.user.role === "admin" || userResponse.data.user.role === "worker") {
          setComplaints(userResponse.data.complaints || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (buildingNumber && floorNumber) {
      fetchData();
    }
  }, [buildingNumber, floorNumber]);

  const getComplaintCountForRoom = (roomNumber: string) => {
    return complaints.filter(
      (c) =>
        c.buildingNumber === buildingNumber &&
        c.floorNumber === floorNumber &&
        c.roomNumber === roomNumber &&
        c.status === "pending"
    ).length;
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { roomNumber: newRoomNumber };
      if (selectedLayout === "none") {
        payload.layoutType = "none";
      } else if (selectedLayout) {
        payload.layoutTemplateName = selectedLayout;
      }

      await api.post(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms`, payload);
      setNewRoomNumber("");
      setSelectedLayout(templates.length > 0 ? templates[0].templateName : "none");
      setShowAddForm(false);
      const response = await api.get(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms`);
      setRooms(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error adding room");
    }
  };

  const handleDelete = async (roomNumber: string) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await api.delete(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}`);
      const response = await api.get(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms`);
      setRooms(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error deleting room");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <button
            onClick={() => navigate(`/buildings/${buildingNumber}/floors`)}
            className="text-purple-600 hover:underline mb-4"
          >
            ← Back to Floors
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Rooms - Block {buildingNumber}, Floor {floorNumber}
          </h1>
          {user?.role === "admin" && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              {showAddForm ? "Cancel" : "Add Room"}
            </button>
          )}
        </div>

        <div className="flex">
          <aside className="w-64 mr-6 hidden md:block">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-bold mb-3">Search Rooms</h3>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by room number"
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
            {showAddForm && user?.role === "admin" && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Add New Room</h2>
                <form onSubmit={handleAddRoom} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Room Number</label>
                    <input
                      type="text"
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Layout</label>
                    <select
                      value={selectedLayout}
                      onChange={(e) => setSelectedLayout(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {templates.length === 0 && <option value="none">No Layouts Defined</option>}
                      {templates.map((t) => (
                        <option key={t.templateName} value={t.templateName}>{t.templateName}</option>
                      ))}
                      <option value="none">No Layout (Empty)</option>
                    </select>
                  </div>
                  <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                    Add Room
                  </button>
                </form>
              </div>
            )}

            {sortedAndFilteredRooms.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <p className="text-gray-500">No rooms found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAndFilteredRooms.map((room) => {
                  const complaintCount = getComplaintCountForRoom(room.roomNumber);
                  // Count all assets from new layout.assets structure
                  let assetCount = 0;
                  if (room.layout?.assets) {
                    Object.values(room.layout.assets).forEach((assets: any) => {
                      if (Array.isArray(assets)) assetCount += assets.length;
                    });
                  }
                  return (
                    <div key={room.roomNumber} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">Room {room.roomNumber}</h2>
                          {(user?.role === "admin" || user?.role === "worker") && (
                            <div className="text-gray-600 text-sm mt-1">
                              <span>{assetCount} asset(s)</span>
                              {complaintCount > 0 && (
                                <span className="ml-2 text-red-600">• {complaintCount} complaint(s)</span>
                              )}
                            </div>
                          )}
                        </div>
                        {user?.role === "admin" && (
                          <button
                            onClick={() => handleDelete(room.roomNumber)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <Link
                        to={`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${room.roomNumber}/objects`}
                        className="block bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
                      >
                        View Assets
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Rooms;

