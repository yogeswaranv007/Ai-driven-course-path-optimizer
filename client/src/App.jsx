import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import GeneratePlan from './pages/GeneratePlan.jsx';
import ProfileSettings from './pages/ProfileSettings.jsx';
import RoadmapDetail from './pages/RoadmapDetail.jsx';
import MyPlan from './pages/MyPlan.jsx';
import PlanHistory from './pages/PlanHistory.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import Navbar from './components/Navbar.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

const App = () => {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/generate-plan"
          element={
            <ProtectedRoute>
              <GeneratePlan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roadmaps/:id"
          element={
            <ProtectedRoute>
              <RoadmapDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-plan"
          element={
            <ProtectedRoute>
              <MyPlan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <PlanHistory />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;
