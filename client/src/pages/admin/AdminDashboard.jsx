import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service.js';
import OverviewTab from './views/OverviewTab.jsx';
import UsersTab from './views/UsersTab.jsx';
import TemplatesTab from './views/TemplatesTab.jsx';
import SettingsTab from './views/SettingsTab.jsx';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
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
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold font-display text-gray-900 tracking-tight">
            Admin <span className="text-gradient">Control Center</span>
          </h1>
          <p className="text-gray-500 mt-2">
            Absolute management over users, AI roadmaps, and platform statistics.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-gray-200 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {['overview', 'users', 'templates', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm border-x border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && <OverviewTab stats={stats} users={users} />}
          {activeTab === 'users' && <UsersTab users={users} refresh={fetchDashboardData} />}
          {activeTab === 'templates' && <TemplatesTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
