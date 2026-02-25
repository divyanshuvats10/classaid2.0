import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { User } from "../types";

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [editingSubrole, setEditingSubrole] = useState("");
  const navigate = useNavigate();

  const workerSubroles = ["carpenter", "electrician", "ac_technician"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userResponse = await api.get("/dashboard");
        setCurrentUser(userResponse.data.user);
        
        // Check if user is admin
        if (userResponse.data.user.role !== "admin") {
          navigate("/dashboard");
          return;
        }

        const usersResponse = await api.get("/users");
        setUsers(usersResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleEditWorker = (worker: User) => {
    setEditingWorker(worker);
    setEditingSubrole(worker.subrole || "");
  };

  const handleSaveSubrole = async () => {
    if (!editingWorker) return;
    try {
      await api.patch(`/users/${editingWorker.registration_number}/subrole`, {
        subrole: editingSubrole || null
      });
      const updatedUsers = users.map((u) =>
        u.registration_number === editingWorker.registration_number ? { ...u, subrole: editingSubrole || undefined } : u
      );
      setUsers(updatedUsers);
      setEditingWorker(null);
      setEditingSubrole("");
    } catch (error) {
      console.error("Error updating subrole:", error);
      alert("Failed to update subrole");
    }
  };

  const groupedUsers = {
    admin: users.filter((u) => u.role === "admin"),
    worker: users.filter((u) => u.role === "worker"),
    teacher: users.filter((u) => u.role === "teacher"),
    student: users.filter((u) => u.role === "student")
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard - Users</h1>
          <p className="text-gray-600 mt-2">Total Users: {users.length}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Admins</h3>
            <p className="text-3xl font-bold text-purple-600">{groupedUsers.admin.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Workers</h3>
            <p className="text-3xl font-bold text-blue-600">{groupedUsers.worker.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Teachers</h3>
            <p className="text-3xl font-bold text-orange-600">{groupedUsers.teacher.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Students</h3>
            <p className="text-3xl font-bold text-green-600">{groupedUsers.student.length}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Admins Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-4 h-4 bg-purple-600 rounded-full mr-3"></span>
              Admins ({groupedUsers.admin.length})
            </h2>
            {groupedUsers.admin.length === 0 ? (
              <p className="text-gray-500">No admins found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-300">
                    <tr>
                      <th className="py-2 px-3 font-semibold text-gray-700">Name</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Registration Number</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedUsers.admin.map((user) => (
                      <tr key={user.registration_number} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-800">{user.name}</td>
                        <td className="py-3 px-3 text-gray-600">{user.registration_number}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => navigate(`/profile/${user.registration_number}`)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Workers Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-4 h-4 bg-blue-600 rounded-full mr-3"></span>
              Workers ({groupedUsers.worker.length})
            </h2>
            {groupedUsers.worker.length === 0 ? (
              <p className="text-gray-500">No workers found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-300">
                    <tr>
                      <th className="py-2 px-3 font-semibold text-gray-700">Name</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Registration Number</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Subrole</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedUsers.worker.map((user) => (
                      <tr key={user.registration_number} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-800">{user.name}</td>
                        <td className="py-3 px-3 text-gray-600">{user.registration_number}</td>
                        <td className="py-3 px-3 text-gray-600">{user.subrole || "—"}</td>
                        <td className="py-3 px-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/profile/${user.registration_number}`)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => handleEditWorker(user)}
                              className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Teachers Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-4 h-4 bg-orange-600 rounded-full mr-3"></span>
              Teachers ({groupedUsers.teacher.length})
            </h2>
            {groupedUsers.teacher.length === 0 ? (
              <p className="text-gray-500">No teachers found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-300">
                    <tr>
                      <th className="py-2 px-3 font-semibold text-gray-700">Name</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Registration Number</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedUsers.teacher.map((user) => (
                      <tr key={user.registration_number} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-800">{user.name}</td>
                        <td className="py-3 px-3 text-gray-600">{user.registration_number}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => navigate(`/profile/${user.registration_number}`)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Students Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-4 h-4 bg-green-600 rounded-full mr-3"></span>
              Students ({groupedUsers.student.length})
            </h2>
            {groupedUsers.student.length === 0 ? (
              <p className="text-gray-500">No students found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-300">
                    <tr>
                      <th className="py-2 px-3 font-semibold text-gray-700">Name</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Registration Number</th>
                      <th className="py-2 px-3 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedUsers.student.map((user) => (
                      <tr key={user.registration_number} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-800">{user.name}</td>
                        <td className="py-3 px-3 text-gray-600">{user.registration_number}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => navigate(`/profile/${user.registration_number}`)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Edit Subrole Modal */}
        {editingWorker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Edit Subrole for {editingWorker.name}</h3>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Select Subrole</label>
                <select
                  value={editingSubrole}
                  onChange={(e) => setEditingSubrole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">None</option>
                  {workerSubroles.map((subrole) => (
                    <option key={subrole} value={subrole}>
                      {subrole.charAt(0).toUpperCase() + subrole.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveSubrole}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingWorker(null);
                    setEditingSubrole("");
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
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

export default AdminDashboard;
