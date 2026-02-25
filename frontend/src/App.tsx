import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Buildings from "./pages/Buildings";
import Floors from "./pages/Floors";
import Rooms from "./pages/Rooms";
import RoomObjects from "./pages/RoomObjects";
import ComplaintHistory from "./pages/ComplaintHistory";
import LayoutEditorDnd from "./pages/LayoutEditorDnd";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:registrationNumber"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buildings"
          element={
            <ProtectedRoute>
              <Buildings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buildings/:buildingNumber/floors"
          element={
            <ProtectedRoute>
              <Floors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buildings/:buildingNumber/floors/:floorNumber/rooms"
          element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects"
          element={
            <ProtectedRoute>
              <RoomObjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/objects/:objectNumber/complaints"
          element={
            <ProtectedRoute>
              <ComplaintHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buildings/:buildingNumber/floors/:floorNumber/rooms/:roomNumber/layout-editor"
          element={
            <ProtectedRoute>
              <LayoutEditorDnd />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;

