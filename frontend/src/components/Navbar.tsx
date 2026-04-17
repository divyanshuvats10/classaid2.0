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
        return "bg-red-600 text-white";
      case "worker":
        return "bg-yellow-500 text-black";
      case "teacher":
        return "bg-orange-500 text-white";
      default:
        return "bg-green-500 text-white";
    }
  };

  return (
    <nav className="bg-black text-white shadow-2xl relative overflow-hidden">
      {/* Geometric Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-red-600 transform rotate-45 -translate-x-16 -translate-y-16"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500 transform rotate-12 translate-x-8 -translate-y-8"></div>
      </div>

      <div className="container mx-auto px-6 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-3xl font-black hover:text-yellow-400 transition-all duration-300 transform hover:scale-105">
              CLASS<span className="text-red-500">AID</span>
            </Link>
            <div className="flex space-x-6">
              <Link to="/dashboard" className="nav-link">
                DASHBOARD
              </Link>
              {user && (
                <Link to={`/profile/${user.registration_number}`} className="nav-link">
                  PROFILE
                </Link>
              )}
              <Link to="/buildings" className="nav-link">
                BLOCKS
              </Link>
              {user?.role === "admin" && (
                <Link to="/admin/users" className="nav-link">
                  USERS
                </Link>
              )}
            </div>
          </div>
          {user && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold uppercase tracking-wide">{user.name}</span>
                <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider ${getRoleColor(user.role)} transform rotate-1`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-primary text-sm"
              >
                LOGOUT
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

