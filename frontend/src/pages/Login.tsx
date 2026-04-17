import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const Login = () => {
  const [formData, setFormData] = useState({
    registration_number: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post("/login", formData);
      if (response.data.message === "Login successful") {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-40 h-40 bg-red-600 opacity-10 transform rotate-45"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-yellow-500 opacity-10 transform -rotate-30"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="card mb-6">
          <h2 className="text-4xl font-black text-center mb-2 text-red-600">LOGIN</h2>
          <div className="w-16 h-1 bg-yellow-500 mx-auto mb-6"></div>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-100 text-red-800 p-4 mb-6 rounded-none border-l-4 border-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-black font-black uppercase text-sm mb-2 tracking-wide">
                Registration Number
              </label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-black font-black uppercase text-sm mb-2 tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary text-lg"
            >
              LOGIN
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 uppercase text-sm tracking-wide">
              Don't have an account?{" "}
              <Link to="/register" className="text-red-600 font-bold hover:text-red-800 uppercase">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

