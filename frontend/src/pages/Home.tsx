import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Geometric Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-red-600 opacity-20 transform rotate-45"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-yellow-500 opacity-20 transform -rotate-12"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-blue-500 opacity-20 transform rotate-30"></div>
        <div className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-green-500 opacity-20 transform -rotate-45"></div>
      </div>

      <div className="text-center text-white relative z-10 px-6 animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-8xl font-black mb-4 text-shadow">
            CLASS<span className="text-red-500">AID</span>
          </h1>
          <div className="w-32 h-1 bg-yellow-500 mx-auto mb-6 transform rotate-1"></div>
          <p className="text-3xl font-bold uppercase tracking-wider mb-2">
            College Room
          </p>
          <p className="text-xl font-semibold uppercase tracking-wide text-yellow-400">
            Management System
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link
            to="/login"
            className="btn-primary text-xl px-8 py-4"
          >
            LOGIN
          </Link>
          <Link
            to="/register"
            className="btn-secondary text-xl px-8 py-4"
          >
            REGISTER
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="card animate-slide-in" style={{animationDelay: '0.2s'}}>
            <h3 className="text-red-600 font-black mb-2">REPORT</h3>
            <p className="text-gray-700">Submit complaints about classroom facilities instantly</p>
          </div>
          <div className="card animate-slide-in" style={{animationDelay: '0.4s'}}>
            <h3 className="text-yellow-600 font-black mb-2">TRACK</h3>
            <p className="text-gray-700">Monitor maintenance progress and asset status</p>
          </div>
          <div className="card animate-slide-in" style={{animationDelay: '0.6s'}}>
            <h3 className="text-blue-600 font-black mb-2">MANAGE</h3>
            <p className="text-gray-700">Admin tools for facility oversight and worker coordination</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

