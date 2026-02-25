import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { User } from "../types";

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/dashboard");
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500";
      case "worker":
        return "bg-yellow-500";
      case "teacher":
        return "bg-orange-500";
      default:
        return "bg-green-500";
    }
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="text-2xl font-bold hover:text-purple-200">
              ClassAid
            </Link>
            <div className="flex space-x-4">
              <Link to="/dashboard" className="hover:text-purple-200 transition">
                Dashboard
              </Link>
              {user && (
                <Link to={`/profile/${user.registration_number}`} className="hover:text-purple-200 transition">
                  Profile
                </Link>
              )}
              <Link to="/buildings" className="hover:text-purple-200 transition">
                Blocks
              </Link>
              {user?.role === "admin" && (
                <Link to="/admin/users" className="hover:text-purple-200 transition">
                  Users
                </Link>
              )}
            </div>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{user.name}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleColor(user.role)}`}>
                  {user.role.toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

