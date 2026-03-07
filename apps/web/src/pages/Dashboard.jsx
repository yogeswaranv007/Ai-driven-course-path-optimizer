import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const Dashboard = () => {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all roadmaps
        const roadmapsRes = await api.get('/roadmaps');
        setRoadmaps(roadmapsRes.data.roadmaps || []);

        // Fetch user stats
        const statsRes = await api.get('/roadmaps/stats');
        setStats(statsRes.data.stats);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600">Manage your learning roadmaps</p>
            </div>
            <Link to="/generate-plan">
              <Button variant="primary">
                <svg
                  className="w-5 h-5 mr-2 inline-block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Roadmap
              </Button>
            </Link>
          </div>
        </div>

        {roadmaps.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* Total Roadmaps Card */}
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Total Roadmaps</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.totalRoadmaps || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </Card>

              {/* Active Roadmaps Card */}
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Active Roadmaps</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.activeRoadmaps || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </Card>

              {/* Completed Roadmaps Card */}
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.completedRoadmaps || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-sky-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Roadmaps List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Your Roadmaps</h2>
                <Link
                  to="/profile"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Manage Skills →
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {roadmaps.map((roadmap) => (
                  <Card
                    key={roadmap._id}
                    className="hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {roadmap.roleName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Created{' '}
                            {new Date(roadmap.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(roadmap.status)}>{roadmap.status}</Badge>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">
                            {Math.round(roadmap.completionPercentage || 0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${roadmap.completionPercentage || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Weeks</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {roadmap.totalWeeks || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tasks</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {roadmap.totalTasks || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Daily</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {roadmap.dailyLearningMinutes} min
                          </p>
                        </div>
                      </div>

                      {/* Skill Source Badge */}
                      {roadmap.skillSource && (
                        <div className="pt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {roadmap.skillSource === 'profile'
                              ? '📋 Profile Skills'
                              : '✨ Custom Skills'}
                          </span>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        <Link to={`/roadmaps/${roadmap._id}`}>
                          <Button variant="secondary" className="w-full">
                            View Roadmap →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        ) : (
          <Card>
            <EmptyState
              title="No Roadmaps Yet"
              description="Create your first personalized learning roadmap by selecting a job role and your skill level."
              action={
                <Link to="/generate-plan">
                  <Button variant="primary">Create Your First Roadmap</Button>
                </Link>
              }
              icon={() => (
                <svg
                  className="w-full h-full text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
