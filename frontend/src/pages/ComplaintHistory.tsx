import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { Complaint, User } from "../types";

const ComplaintHistory = () => {
  const { buildingNumber, floorNumber, roomNumber, objectNumber } = useParams<{
    buildingNumber: string;
    floorNumber: string;
    roomNumber: string;
    objectNumber: string;
  }>();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await api.get("/dashboard");
        setUser(userResponse.data.user);
        const complaintsResponse = await api.get(
          `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects/${objectNumber}/complaints`
        );
        setComplaints(complaintsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (buildingNumber && floorNumber && roomNumber && objectNumber) {
      fetchData();
    }
  }, [buildingNumber, floorNumber, roomNumber, objectNumber]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/complaints", {
        objectNumber,
        buildingNumber,
        floorNumber,
        roomNumber,
        text: complaintText,
      });
      setComplaintText("");
      setShowForm(false);
      const response = await api.get(
        `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects/${objectNumber}/complaints`
      );
      setComplaints(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error submitting complaint");
    }
  };

  const handleResolve = async (complaintId: string) => {
    try {
      const remark = window.prompt("Enter remark for resolution (optional)");
      if (remark === null) return; // user cancelled
      await api.patch(`/complaints/${complaintId}/resolve`, { remark });
      const response = await api.get(
        `/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects/${objectNumber}/complaints`
      );
      setComplaints(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error resolving complaint");
    }
  };

  const getStatusColor = (status: string) => {
    return status === "pending" ? "bg-yellow-500" : "bg-green-500";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <button
            onClick={() =>
              navigate(`/buildings/${buildingNumber}/floors/${floorNumber}/rooms/${roomNumber}/objects`)
            }
            className="text-purple-600 hover:underline mb-4"
          >
            ← Back to Assets
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Complaints - {objectNumber} (Block {buildingNumber}, Floor {floorNumber}, Room {roomNumber})
          </h1>
          {user && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              {showForm ? "Cancel" : "Submit Complaint"}
            </button>
          )}

        </div>

        {showForm && user?.role === "student" && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Submit New Complaint</h2>
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Complaint Description</label>
                <textarea
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                  required
                />
              </div>
              <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                Submit Complaint
              </button>
            </form>
          </div>
        )}

        {complaints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-500">No complaints found for this asset</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getStatusColor(complaint.status)}`}>
                        {complaint.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-800 mb-3">{complaint.text}</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-semibold">Logged by:</span> {complaint.loggedBy.name} (
                        {complaint.loggedBy.registrationNumber})
                      </p>
                      <p>
                        <span className="font-semibold">Date logged:</span>{" "}
                        {new Date(complaint.dateLogged).toLocaleString()}
                      </p>
                      {complaint.status === "resolved" && complaint.resolvedBy && (
                        <div className="mt-2 p-2 bg-green-50 rounded">
                          <p className="text-green-700">
                            <span className="font-semibold">Resolved by:</span> {complaint.resolvedBy.name} (
                            {complaint.resolvedBy.registrationNumber})
                          </p>
                          <p className="text-green-700">
                            <span className="font-semibold">Date resolved:</span>{" "}
                            {new Date(complaint.dateResolved!).toLocaleString()}
                          </p>
                          {complaint.resolvedRemark && (
                            <p className="mt-2 text-green-700">
                              <span className="font-semibold">Remark:</span> {complaint.resolvedRemark}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {user && (user.role === "admin" || user.role === "worker") && complaint.status === "pending" && (
                    <button
                      onClick={() => handleResolve(complaint._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition ml-4"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintHistory;

