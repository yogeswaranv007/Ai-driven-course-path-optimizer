import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      console.error(err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteRoadmap = async () => {
    // In a real app we might fetch user's roadmaps first and let admin choose which to delete.
    // For simplicity, we just delete the user's latest roadmap if requested, or integrate a specific roadmap ID.
    // This is a placeholder alert teaching the admin.
    alert(
      'To delete roadmaps, you would pass the specific Roadmap ID to adminService.deleteRoadmap(id).'
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 text-center">
        <h2 className="text-xl text-red-600">{error}</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12 bg-gray-50/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold font-display text-gray-900 tracking-tight">
            Admin <span className="text-gradient">Control Center</span>
          </h1>
          <p className="text-gray-500 mt-2">
            Manage users and track platform performance at a glance.
          </p>
        </header>

        {/* Top Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="flex flex-col items-center justify-center p-8 border-l-4 border-l-indigo-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">
              Total Users
            </h3>
            <span className="text-5xl font-bold text-gray-900">{stats?.totalUsers || 0}</span>
          </Card>

          <Card className="flex flex-col items-center justify-center p-8 border-l-4 border-l-emerald-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">
              Total Roadmaps
            </h3>
            <span className="text-5xl font-bold text-gray-900">{stats?.totalRoadmaps || 0}</span>
          </Card>

          <Card className="flex flex-col items-center justify-center p-8 border-l-4 border-l-sky-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">
              Active Generation
            </h3>
            <span className="text-5xl font-bold text-gray-900">{stats?.activeRoadmaps || 0}</span>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Goal Distribution Pie Chart */}
          <Card className="flex flex-col col-span-1 min-h-[400px]">
            <h3 className="text-lg font-bold text-gray-800 mb-6">User Global Objectives</h3>
            <div className="flex-1 w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.goalsChartData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.goalsChartData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* User Roadmap Count Activity (Placeholder for activity/bar chart) */}
          <Card className="flex flex-col col-span-1 min-h-[400px]">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Activity by Users</h3>
            <div className="flex-1 w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={users.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="roadmapCount" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Showing top 10 recent users' generated plans.
            </p>
          </Card>
        </div>

        {/* User Management Table */}
        <Card className="w-full overflow-hidden p-0 mb-10 !border-0 shadow-lg">
          <div className="p-6 border-b border-gray-100 bg-white/50">
            <h3 className="text-xl font-bold text-gray-900">Registered Users</h3>
            <p className="text-sm text-gray-500">
              Full directory of active users to manage access and roadmaps.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm font-medium border-b border-gray-100">
                  <th className="p-4 px-6">Name</th>
                  <th className="p-4 px-6">Email</th>
                  <th className="p-4 px-6">Role</th>
                  <th className="p-4 px-6 text-center">Roadmaps Generated</th>
                  <th className="p-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                        {user.name.substring(0, 2)}
                      </div>
                      {user.name}
                    </td>
                    <td className="p-4 px-6 text-gray-600 text-sm">{user.email}</td>
                    <td className="p-4 px-6">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-center text-gray-700 font-medium">
                      {user.roadmapCount}
                    </td>
                    <td className="p-4 px-6 text-right">
                      {user.role !== 'admin' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRoadmap(user._id)}
                          className="shadow-none scale-90"
                        >
                          Delete Plans
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
