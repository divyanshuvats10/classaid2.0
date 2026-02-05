import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">ClassAid</h1>
        <p className="text-2xl mb-8">College Room Management System</p>
        <div className="space-x-4">
          <Link
            to="/login"
            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-100 transition inline-block"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition inline-block"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;

