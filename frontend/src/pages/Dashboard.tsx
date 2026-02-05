import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { User, Complaint } from "../types";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");

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

  const filteredComplaints = complaints.filter((complaint) => {
    if (filter === "all") return true;
    return complaint.status === filter;
  });

  const getStatusColor = (status: string) => {
    return status === "pending" ? "bg-yellow-500" : "bg-green-500";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>
          {user && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg">
              <p className="text-lg">
                <span className="font-semibold">Welcome,</span> {user.name}
              </p>
              <p className="text-gray-600">Role: {user.role.toUpperCase()}</p>
              <p className="text-gray-600">Registration: {user.registration_number}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Complaints</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded ${filter === "all" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded ${filter === "pending" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("resolved")}
                className={`px-4 py-2 rounded ${filter === "resolved" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
              >
                Resolved
              </button>
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No complaints found</p>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div key={complaint._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getStatusColor(complaint.status)}`}>
                          {complaint.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          Block {complaint.buildingNumber} • Floor {complaint.floorNumber} • Room {complaint.roomNumber}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-2">{complaint.text}</p>
                      <div className="text-sm text-gray-600">
                        <p>Asset: {complaint.objectNumber}</p>
                        <p>Logged by: {complaint.loggedBy.name} ({complaint.loggedBy.registrationNumber})</p>
                        <p>Date: {new Date(complaint.dateLogged).toLocaleString()}</p>
                        {complaint.status === "resolved" && complaint.resolvedBy && (
                          <p className="text-green-600 mt-1">
                            Resolved by: {complaint.resolvedBy.name} on {new Date(complaint.dateResolved!).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/buildings/${complaint.buildingNumber}/floors/${complaint.floorNumber}/rooms/${complaint.roomNumber}/objects/${complaint.objectNumber}/complaints`}
                      className="text-purple-600 hover:underline ml-4"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

