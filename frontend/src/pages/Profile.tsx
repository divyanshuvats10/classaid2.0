import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { User, Complaint } from "../types";

const Profile = () => {
  const { registrationNumber } = useParams<{ registrationNumber: string }>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [resolvedComplaints, setResolvedComplaints] = useState<Complaint[]>([]);
  const [activeTab, setActiveTab] = useState<"lodged" | "fixed">("lodged");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch current user
        const userResponse = await api.get("/dashboard");
        setCurrentUser(userResponse.data.user);

        // Fetch target user profile
        const targetResponse = await api.get(`/users/${registrationNumber}`);
        setTargetUser(targetResponse.data.user);

        // Fetch complaints based on user roles
        if (targetResponse.data.user.role === "admin" || targetResponse.data.user.role === "worker") {
          // For workers/admins, fetch both lodged and resolved complaints
          const [allComplaintsRes, resolvedRes] = await Promise.all([
            api.get("/dashboard"), // This gets complaints where user is involved
            api.get("/complaints/resolved")
          ]);

          // Filter complaints lodged by this user
          const lodgedComplaints = allComplaintsRes.data.complaints.filter(
            (c: Complaint) => c.loggedBy.registrationNumber === registrationNumber
          );

          // Filter complaints resolved by this user
          const fixedComplaints = resolvedRes.data.filter(
            (c: Complaint) => c.resolvedBy?.registrationNumber === registrationNumber
          );

          setComplaints(lodgedComplaints);
          setResolvedComplaints(fixedComplaints);
        } else {
          // For students/teachers, fetch only their lodged complaints
          const complaintsRes = await api.get("/dashboard");
          const userComplaints = complaintsRes.data.complaints.filter(
            (c: Complaint) => c.loggedBy.registrationNumber === registrationNumber
          );
          setComplaints(userComplaints);
        }

      } catch (err: any) {
        console.error("Error fetching profile data:", err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (registrationNumber) {
      fetchData();
    }
  }, [registrationNumber]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "looking": return "bg-blue-500";
      case "resolved": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "looking": return "LOOKING INTO IT";
      default: return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-red-500">{error || "User not found"}</p>
            <Link to="/admin/users" className="text-blue-600 hover:underline mt-4 inline-block">
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.registration_number === registrationNumber;
  const canViewFixedComplaints = targetUser.role === "admin" || targetUser.role === "worker";
  const showFixedTab = canViewFixedComplaints && (isOwnProfile || currentUser?.role === "admin");

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{targetUser.name}</h1>
              <p className="text-gray-600">Registration: {targetUser.registration_number}</p>
              <p className="text-gray-600">Role: {targetUser.role.toUpperCase()}</p>
              {targetUser.subrole && (
                <p className="text-gray-600">
                  Specialization: {targetUser.subrole === "ac_technician" ? "AC Technician" : targetUser.subrole.charAt(0).toUpperCase() + targetUser.subrole.slice(1)}
                </p>
              )}
            </div>
            {!isOwnProfile && (
              <Link
                to="/admin/users"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Back to Admin Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Complaint History Tabs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Complaint History</h2>

            {/* Tab Navigation */}
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("lodged")}
                className={`px-4 py-2 font-semibold text-sm ${
                  activeTab === "lodged"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-500 hover:text-purple-600"
                }`}
              >
                Lodged Complaints ({complaints.length})
              </button>
              {showFixedTab && (
                <button
                  onClick={() => setActiveTab("fixed")}
                  className={`px-4 py-2 font-semibold text-sm ${
                    activeTab === "fixed"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-purple-600"
                  }`}
                >
                  Fixed Complaints ({resolvedComplaints.length})
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "lodged" && (
            <div>
              {complaints.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No complaints lodged yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div key={complaint._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getStatusColor(complaint.status)}`}>
                              {getStatusLabel(complaint.status)}
                            </span>
                            <span className="text-sm text-gray-600">
                              Block {complaint.buildingNumber} • Floor {complaint.floorNumber} • Room {complaint.roomNumber}
                            </span>
                          </div>
                          <p className="text-gray-800 mb-2">{complaint.text}</p>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Asset: {complaint.objectNumber}</p>
                            <p>Logged on: {new Date(complaint.dateLogged).toLocaleString()}</p>
                            {complaint.lookingInto && (
                              <p className="text-blue-600 mt-1">
                                Looking into by: {complaint.lookingInto.name} ({complaint.lookingInto.registrationNumber})
                              </p>
                            )}
                            {complaint.status === "resolved" && complaint.resolvedBy && (
                              <p className="text-green-600 mt-1">
                                Resolved by: {complaint.resolvedBy.name} on {new Date(complaint.dateResolved!).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4 min-w-max">
                          <Link
                            to={`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm text-center whitespace-nowrap"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "fixed" && showFixedTab && (
            <div>
              {resolvedComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No complaints fixed yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resolvedComplaints.map((complaint) => (
                    <div key={complaint._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 rounded text-xs font-semibold text-white bg-green-600">
                              RESOLVED
                            </span>
                            <span className="text-sm text-gray-600">
                              Block {complaint.buildingNumber} • Floor {complaint.floorNumber} • Room {complaint.roomNumber}
                            </span>
                          </div>
                          <p className="text-gray-800 mb-2">{complaint.text}</p>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Asset: {complaint.objectNumber}</p>
                            <p>Resolved on: {new Date(complaint.dateResolved!).toLocaleString()}</p>
                            {complaint.resolvedRemark && (
                              <p className="mt-2 text-green-700">
                                <span className="font-semibold">Remark:</span> {complaint.resolvedRemark}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4 min-w-max">
                          <Link
                            to={`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm text-center whitespace-nowrap"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;