import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { User, Complaint } from "../types";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "looking" | "resolved">("all");
  const [blockFilter, setBlockFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [resolvedComplaints, setResolvedComplaints] = useState<Complaint[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"today" | "week" | "month" | "all" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/dashboard");
        setUser(response.data.user);
        setComplaints(response.data.complaints);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
  }, []);

  const getRoleOrder = (role: string): number => {
    switch (role) {
      case "admin": return 1;
      case "worker": return 2;
      case "teacher": return 3;
      case "student": return 4;
      default: return 5;
    }
  };

  // Subrole asset type mappings
  const getSubroleAssets = (subrole: string): string[] => {
    switch (subrole) {
      case "carpenter":
        return ["board", "table", "chair", "tablechair"];
      case "electrician":
        return ["projector", "fan"];
      case "ac_technician":
        return ["ac"];
      default:
        return [];
    }
  };

  // Get "For You" complaints for workers
  const getForYouComplaints = () => {
    if (user?.role !== "worker" || !user?.subrole) return [];
    const assetTypes = getSubroleAssets(user.subrole);
    return complaints.filter((c) => {
      if (c.status !== "pending") return false;
      return assetTypes.some((asset) => c.objectNumber.toLowerCase().startsWith(asset.toLowerCase()));
    });
  };

  const getFilteredByLocation = (complaints: Complaint[]): Complaint[] => {
    return complaints.filter((c) => {
      if (blockFilter && c.buildingNumber !== blockFilter) return false;
      if (floorFilter && c.floorNumber !== floorFilter) return false;
      if (roomFilter && c.roomNumber !== roomFilter) return false;
      return true;
    });
  };

  const getSortedComplaints = () => {
    let result: Complaint[] = [];
    const pending = complaints.filter((c) => c.status === "pending");
    const looking = complaints.filter((c) => c.status === "looking");
    const resolved = complaints.filter((c) => c.status === "resolved");

    // Sort pending by role order (admin first, worker second, teacher third, student fourth)
    // Within each role, sort by date logged (older first = most at top)
    pending.sort((a, b) => {
      const roleA = a.loggedBy?.role || "student";
      const roleB = b.loggedBy?.role || "student";
      const roleCompare = getRoleOrder(roleA) - getRoleOrder(roleB);
      if (roleCompare !== 0) return roleCompare;
      // If same role, older complaints first
      return new Date(a.dateLogged).getTime() - new Date(b.dateLogged).getTime();
    });

    // Sort looking by date marked (newer first)
    looking.sort((a, b) => {
      const dateA = a.lookingInto?.dateMarked ? new Date(a.lookingInto.dateMarked).getTime() : 0;
      const dateB = b.lookingInto?.dateMarked ? new Date(b.lookingInto.dateMarked).getTime() : 0;
      return dateB - dateA; // Newer first
    });

    // Sort resolved by resolution date (older first)
    resolved.sort((a, b) => {
      const dateA = a.dateResolved ? new Date(a.dateResolved).getTime() : 0;
      const dateB = b.dateResolved ? new Date(b.dateResolved).getTime() : 0;
      return dateA - dateB;
    });

    if (filter === "all") {
      result = [...pending, ...looking, ...resolved];
    } else if (filter === "pending") {
      result = pending;
    } else if (filter === "looking") {
      result = looking;
    } else if (filter === "resolved") {
      result = resolved;
    }
    
    // Apply location filters for admins and workers
    if (user?.role === "admin" || user?.role === "worker") {
      result = getFilteredByLocation(result);
    }
    
    return result;
  };

  const filteredComplaints = getSortedComplaints();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-500";
      case "looking":
        return "bg-teal-500";
      case "resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "looking":
        return "LOOKING INTO IT";
      default:
        return status.toUpperCase();
    }
  };

  const handleMarkAsLooking = async (complaintId: string) => {
    try {
      await api.patch(`/complaints/${complaintId}/looking`);
      // Refresh complaints
      const response = await api.get("/dashboard");
      setComplaints(response.data.complaints);
    } catch (error) {
      console.error("Error marking complaint as looking into it:", error);
      alert("Failed to mark complaint");
    }
  };

  const handleResolve = async (complaintId: string) => {
    try {
      const remark = window.prompt("Enter remark for resolution (optional)");
      if (remark === null) return; // user cancelled
      await api.patch(`/complaints/${complaintId}/resolve`, { remark });
      // Refresh complaints
      const response = await api.get("/dashboard");
      setComplaints(response.data.complaints);
    } catch (error) {
      console.error("Error resolving complaint:", error);
      alert("Failed to resolve complaint");
    }
  };

  const handleRevertToPending = async (complaintId: string) => {
    try {
      await api.patch(`/complaints/${complaintId}/revert-pending`);
      // Refresh complaints
      const response = await api.get("/dashboard");
      setComplaints(response.data.complaints);
    } catch (error) {
      console.error("Error reverting complaint to pending:", error);
      alert("Failed to revert complaint");
    }
  };

  const handleLike = async (complaintId: string) => {
    try {
      await api.post(`/complaints/${complaintId}/like`);
      // Refresh complaints
      const response = await api.get("/dashboard");
      setComplaints(response.data.complaints);
    } catch (error) {
      console.error("Error updating like status:", error);
      alert("Failed to update like status");
    }
  };

  const getActiveLikesCount = (complaint: Complaint) => {
    return complaint.likes.filter(like => like.isActive).length;
  };

  const isLikedByUser = (complaint: Complaint, user: User | null) => {
    if (!user) return false;
    return complaint.likes.some(like => 
      like.user.registrationNumber === user.registration_number && like.isActive
    );
  };

  const canResolveComplaint = (complaint: Complaint, user: User | null) => {
    if (!user) return false;

    // Admins can resolve any complaint
    if (user.role === "admin") {
      return complaint.status === "pending" || complaint.status === "looking";
    }

    // Workers can only resolve complaints they're currently looking into
    if (user.role === "worker") {
      return complaint.status === "looking" &&
             complaint.lookingInto?.registrationNumber === user.registration_number;
    }

    return false;
  };

  // Fetch resolved complaints for history
  const fetchResolvedComplaints = async () => {
    try {
      const response = await api.get("/complaints/resolved");
      setResolvedComplaints(response.data);
    } catch (error) {
      console.error("Error fetching resolved complaints:", error);
    }
  };

  // Get filtered history complaints based on current filter
  const getFilteredHistoryComplaints = () => {
    if (!user) return [];

    // Filter complaints resolved by current user
    let userResolvedComplaints = resolvedComplaints.filter(
      (complaint) => complaint.resolvedBy?.registrationNumber === user.registration_number
    );

    const now = new Date();
    let startDate: Date;

    switch (historyFilter) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999); // End of day
          return userResolvedComplaints.filter(complaint => {
            const resolvedDate = new Date(complaint.dateResolved!);
            return resolvedDate >= start && resolvedDate <= end;
          });
        }
        return userResolvedComplaints;
      case "all":
      default:
        return userResolvedComplaints;
    }

    return userResolvedComplaints.filter(complaint => {
      const resolvedDate = new Date(complaint.dateResolved!);
      return resolvedDate >= startDate;
    });
  };

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "worker") && activeTab === "history") {
      fetchResolvedComplaints();
    }
  }, [user, activeTab]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="card mb-8">
          <h1 className="text-5xl font-black text-orange-600 mb-4">Dashboard</h1>
          <div className="w-24 h-1 bg-teal-500 mb-6"></div>
          {user && (
            <div className="bg-pattern p-6 rounded-none border-l-8 border-blue-500">
              <p className="text-xl font-bold uppercase tracking-wide">
                Welcome, <span className="text-red-600">{user.name}</span>
              </p>
              <p className="text-gray-700 font-semibold uppercase text-sm tracking-wide mt-2">
                Role: {user.role}
              </p>
              <p className="text-gray-600 uppercase text-xs tracking-wide">
                Registration: {user.registration_number}
              </p>
              {user.subrole && (
                <p className="text-gray-600 uppercase text-xs tracking-wide mt-1">
                  Specialization: {user.subrole === "ac_technician" ? "AC Technician" : user.subrole.charAt(0).toUpperCase() + user.subrole.slice(1)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {(user?.role === "admin" || user?.role === "worker") && (
          <div className="card mb-8">
            <div className="flex space-x-8 border-b-4 border-gray-200 pb-2">
              <button
                onClick={() => setActiveTab("current")}
                className={`px-6 py-3 font-bold text-lg tracking-wide transition-all ${
                  activeTab === "current"
                    ? "text-orange-600 border-b-4 border-orange-600 bg-orange-50"
                    : "text-gray-500 hover:text-orange-600 hover:bg-gray-50"
                }`}
              >
                Current Tasks
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-3 font-bold text-lg tracking-wide transition-all ${
                  activeTab === "history"
                    ? "text-orange-600 border-b-4 border-orange-600 bg-orange-50"
                    : "text-gray-500 hover:text-orange-600 hover:bg-gray-50"
                }`}
              >
                History ({getFilteredHistoryComplaints().length})
              </button>
            </div>
          </div>
        )}

        {/* Current Tasks Tab Content */}
        {activeTab === "current" && (
          <>
            {/* "Looking Into" Section - Only for current user's complaints */}
            {(() => {
              const myLookingIntoComplaints = complaints.filter(
                (c) => c.status === "looking" && c.lookingInto?.registrationNumber === user?.registration_number
              );
              return myLookingIntoComplaints.length > 0 && (user?.role === "admin" || user?.role === "worker") ? (
                <div className="card-alt mb-8 border-l-orange-500">
                  <h2 className="text-3xl font-bold text-orange-600 mb-6 tracking-wide">
                    Looking Into ({myLookingIntoComplaints.length})
                  </h2>
                  <div className="grid-construct">
                    {myLookingIntoComplaints.map((complaint) => (
                    <div 
                      key={complaint._id} 
                      className="card complaint-card"
                      onClick={() => navigate(`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`)}
                    >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold text-white bg-indigo-600">
                                LOOKING INTO IT
                              </span>
                              <span className="text-sm text-gray-600">
                                Block {complaint.buildingNumber} • Floor {complaint.floorNumber} • Room {complaint.roomNumber}
                              </span>
                            </div>
                            <p className="text-gray-800 mb-2">{complaint.text}</p>
                            <div className="flex items-center space-x-4 mb-2">
                              <div className="flex items-center space-x-2">
                                {complaint.status === "pending" && (
                                  <button
                                    onClick={() => handleLike(complaint._id)}
                                    className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                                      isLikedByUser(complaint, user)
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    {isLikedByUser(complaint, user) ? '❤️' : '🤍'} {getActiveLikesCount(complaint)}
                                  </button>
                                )}
                                {complaint.status !== "pending" && getActiveLikesCount(complaint) > 0 && (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                                    ❤️ {getActiveLikesCount(complaint)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>Asset: {complaint.objectNumber}</p>
                              <p>Logged by: {complaint.loggedBy.name} ({complaint.loggedBy.registrationNumber})</p>
                              <p>Date Logged: {new Date(complaint.dateLogged).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 ml-6 min-w-max">
                            <Link
                              to={`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`}
                              className="btn-outline text-sm view-details-btn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Details
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(complaint._id);
                              }}
                              className="btn-secondary text-sm"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevertToPending(complaint._id);
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition font-semibold text-sm whitespace-nowrap"
                            >
                              Revert to Pending
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* "For You" Section for Workers */}
            {user?.role === "worker" && user?.subrole && getForYouComplaints().length > 0 && (
              <div className="card-alt mb-8 border-l-teal-500">
                <h2 className="text-3xl font-bold text-teal-600 mb-6 tracking-wide">
                  For You ({getForYouComplaints().length})
                </h2>
                <div className="grid-construct">
                  {getForYouComplaints().map((complaint) => (
                    <div 
                      key={complaint._id} 
                      className="card complaint-card"
                      onClick={() => navigate(`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`)}
                    >
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
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-2">
                              {complaint.status === "pending" && (
                                <button
                                  onClick={() => handleLike(complaint._id)}
                                  className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                                    isLikedByUser(complaint, user)
                                      ? 'bg-red-500 text-white hover:bg-red-600'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {isLikedByUser(complaint, user) ? '❤️' : '🤍'} {getActiveLikesCount(complaint)}
                                </button>
                              )}
                              {complaint.status !== "pending" && getActiveLikesCount(complaint) > 0 && (
                                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                                  ❤️ {getActiveLikesCount(complaint)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Asset: {complaint.objectNumber}</p>
                            <p>Logged by: {complaint.loggedBy.name} ({complaint.loggedBy.registrationNumber})</p>
                            <p>Date: {new Date(complaint.dateLogged).toLocaleString()}</p>
                            {complaint.lookingInto && (
                              <p className="text-blue-600 mt-1">
                                Looking into by: {complaint.lookingInto.name} ({complaint.lookingInto.registrationNumber})
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 ml-6 min-w-max">
                          <Link
                            to={`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`}
                            className="btn-outline text-sm view-details-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Details
                          </Link>
                          {complaint.status === "pending" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsLooking(complaint._id);
                              }}
                              className="btn-primary text-sm"
                            >
                              Mark Looking
                            </button>
                          )}
                          {canResolveComplaint(complaint, user) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(complaint._id);
                              }}
                              className="btn-secondary text-sm"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Complaints Section */}
            <div className="card">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-orange-600 mb-4 tracking-wide">{user?.role === "worker" && user?.subrole ? "All Complaints" : "Complaints"}</h2>
                
                {/* Filter Section for Admins and Workers */}
                {(user?.role === "admin" || user?.role === "worker") && (
                  <div className="bg-pattern rounded-lg p-6 mb-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800 tracking-wide">Filters</h3>
                      {(blockFilter || floorFilter || roomFilter) && (
                        <button
                          onClick={() => {
                            setBlockFilter("");
                            setFloorFilter("");
                            setRoomFilter("");
                          }}
                          className="btn-primary text-sm"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide">Block Number</label>
                        <input
                          type="text"
                          placeholder="e.g., A101"
                          value={blockFilter}
                          onChange={(e) => setBlockFilter(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide">Floor Number</label>
                        <input
                          type="text"
                          placeholder="e.g., 1"
                          value={floorFilter}
                          onChange={(e) => setFloorFilter(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide">Room Number</label>
                        <input
                          type="text"
                          placeholder="e.g., 101"
                          value={roomFilter}
                          onChange={(e) => setRoomFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Status Filter Buttons */}
                <div className="flex flex-wrap space-x-2">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded ${filter === "all" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter("pending")}
                    className={`px-4 py-2 rounded ${filter === "pending" ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter("looking")}
                    className={`px-4 py-2 rounded ${filter === "looking" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
                  >
                    Looking Into
                  </button>
                  <button
                    onClick={() => setFilter("resolved")}
                    className={`px-4 py-2 rounded ${filter === "resolved" ? "bg-green-600 text-white" : "bg-gray-200"}`}
                  >
                    Resolved
                  </button>
                </div>
              </div>

              {(() => {
                // Filter out "For You" complaints from the all complaints list for workers
                let displayComplaints = filteredComplaints;
                if (user?.role === "worker" && user?.subrole) {
                  const forYouIds = new Set(getForYouComplaints().map((c) => c._id));
                  displayComplaints = filteredComplaints.filter((c) => !forYouIds.has(c._id));
                }
                
                const hasFilters = blockFilter || floorFilter || roomFilter;
                const noResultsMessage = hasFilters 
                  ? "No complaints found matching your filters"
                  : "No complaints found";
                
                return displayComplaints.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">{noResultsMessage}</p>
                ) : (
                  <div className="grid-construct">
                    {displayComplaints.map((complaint) => (
                    <div 
                      key={complaint._id} 
                      className="card complaint-card"
                      onClick={() => navigate(`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`)}
                    >
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
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-2">
                              {complaint.status === "pending" && (
                                <button
                                  onClick={() => handleLike(complaint._id)}
                                  className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                                    isLikedByUser(complaint, user)
                                      ? 'bg-red-500 text-white hover:bg-red-600'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {isLikedByUser(complaint, user) ? '❤️' : '🤍'} {getActiveLikesCount(complaint)}
                                </button>
                              )}
                              {complaint.status !== "pending" && getActiveLikesCount(complaint) > 0 && (
                                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                                  ❤️ {getActiveLikesCount(complaint)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Asset: {complaint.objectNumber}</p>
                            <p>Logged by: {complaint.loggedBy.name} ({complaint.loggedBy.registrationNumber})</p>
                            <p>Date: {new Date(complaint.dateLogged).toLocaleString()}</p>
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
                        <div className="flex flex-col gap-3 ml-6 min-w-max">
                          <Link
                            to={`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`}
                            className="btn-outline text-sm view-details-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Details
                          </Link>
                          {(user?.role === "admin" || user?.role === "worker") && complaint.status === "pending" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsLooking(complaint._id);
                              }}
                              className="btn-primary text-sm"
                            >
                              Mark Looking
                            </button>
                          )}
                          {canResolveComplaint(complaint, user) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(complaint._id);
                              }}
                              className="btn-secondary text-sm"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* History Tab Content */}
        {activeTab === "history" && (user?.role === "admin" || user?.role === "worker") && (
          <div className="card">
            <h2 className="text-3xl font-bold text-orange-600 mb-6 tracking-wide">
              Task History ({getFilteredHistoryComplaints().length} tasks)
            </h2>
            
            {/* History Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setHistoryFilter("today")}
                className={`px-4 py-2 rounded ${historyFilter === "today" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
              >
                Today
              </button>
              <button
                onClick={() => setHistoryFilter("week")}
                className={`px-4 py-2 rounded ${historyFilter === "week" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
              >
                Past Week
              </button>
              <button
                onClick={() => setHistoryFilter("month")}
                className={`px-4 py-2 rounded ${historyFilter === "month" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
              >
                Past Month
              </button>
              <button
                onClick={() => setHistoryFilter("all")}
                className={`px-4 py-2 rounded ${historyFilter === "all" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
              >
                All History
              </button>
              <button
                onClick={() => setHistoryFilter("custom")}
                className={`px-4 py-2 rounded ${historyFilter === "custom" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
              >
                Custom Range
              </button>
            </div>

            {/* Custom Date Range Inputs */}
            {historyFilter === "custom" && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {getFilteredHistoryComplaints().length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No resolved tasks found for the selected period.</p>
              </div>
            ) : (
              <div className="grid-construct">
                {getFilteredHistoryComplaints().map((complaint) => (
                  <div 
                    key={complaint._id} 
                    className="card complaint-card"
                    onClick={() => navigate(`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`)}
                  >
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
                      <div className="flex flex-col gap-3 ml-6 min-w-max">
                        <Link
                          to={`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`}
                          className="btn-outline text-sm view-details-btn"
                          onClick={(e) => e.stopPropagation()}
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
  );
};

export default Dashboard;

