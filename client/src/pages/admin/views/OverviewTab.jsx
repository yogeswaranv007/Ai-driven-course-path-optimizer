import React from 'react';
import Card from '../../../components/ui/Card.jsx';
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

const OverviewTab = ({ stats, users }) => {
  return (
    <div className="animate-fade-in-up">
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
        <Card className="flex flex-col col-span-1 min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Generated Roadmaps by Role</h3>
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

        <Card className="flex flex-col col-span-1 min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Activity by Users</h3>
          <div className="flex-1 w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(users || []).slice(0, 10)}>
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
    </div>
  );
};

export default OverviewTab;
