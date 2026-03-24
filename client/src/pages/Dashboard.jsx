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
  const [activeTab, setActiveTab] = useState('active');
  const [roadmaps, setRoadmaps] = useState([]);
  const [deletedRoadmaps, setDeletedRoadmaps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewRoadmap, setPreviewRoadmap] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [completionFilter, setCompletionFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [createdFrom, setCreatedFrom] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all roadmaps
        const roadmapsRes = await api.get('/roadmaps');
        setRoadmaps(roadmapsRes.data.roadmaps || []);

        // Fetch deleted roadmaps
        const deletedRes = await api.get('/roadmaps/deleted');
        setDeletedRoadmaps(deletedRes.data.roadmaps || []);

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

  const getRoadmapDayStats = (roadmap) => {
    const totalDays =
      roadmap.totalDays ||
      (roadmap.phases || []).reduce((sum, phase) => sum + (phase.days?.length || 0), 0);

    const completedFromPhases = (roadmap.phases || []).reduce(
      (sum, phase) => sum + (phase.days || []).filter((day) => day.status === 'completed').length,
      0
    );

    const completedDays =
      completedFromPhases > 0
        ? completedFromPhases
        : Math.round(((roadmap.completionPercentage || 0) / 100) * (totalDays || 0));

    return {
      completedDays,
      totalDays,
    };
  };

  const isCompletedRoadmap = (roadmap) =>
    roadmap.status === 'completed' || Math.round(roadmap.completionPercentage || 0) >= 100;

  const activeRoadmaps = roadmaps.filter((roadmap) => !isCompletedRoadmap(roadmap));
  const completedRoadmaps = roadmaps.filter((roadmap) => isCompletedRoadmap(roadmap));
  const roleOptions = [
    ...new Set(
      (activeTab === 'completed'
        ? completedRoadmaps
        : activeTab === 'deleted'
          ? deletedRoadmaps
          : activeRoadmaps
      )
        .map((r) => r.roleName)
        .filter(Boolean)
    ),
  ];

  const matchesCompletion = (roadmap) => {
    const completion = roadmap.completionPercentage || 0;
    switch (completionFilter) {
      case '0-25':
        return completion >= 0 && completion <= 25;
      case '26-50':
        return completion > 25 && completion <= 50;
      case '51-75':
        return completion > 50 && completion <= 75;
      case '76-100':
        return completion > 75 && completion <= 100;
      default:
        return true;
    }
  };

  const getProgressCategory = (roadmap) => {
    const completion = Math.round(roadmap.completionPercentage || 0);
    if (roadmap.status === 'completed' || completion >= 100) return 'completed';
    if (completion <= 0) return 'not-started';
    return 'in-progress';
  };

  const getProgressCategoryLabel = (category) => {
    switch (category) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const getProgressCategoryBadgeVariant = (category) => {
    switch (category) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filterRoadmaps = (sourceRoadmaps, dateField = 'createdAt') =>
    sourceRoadmaps.filter((roadmap) => {
      const name = (roadmap.roadmapName || '').toLowerCase();
      const role = (roadmap.roleName || '').toLowerCase();
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        name.includes(query) ||
        role.includes(query) ||
        (roadmap.status || '').includes(query);

      const matchesRole = roleFilter === 'all' || roadmap.roleName === roleFilter;
      const progressCategory = getProgressCategory(roadmap);
      const matchesProgress = progressFilter === 'all' || progressCategory === progressFilter;

      const timelineDate = roadmap[dateField] ? new Date(roadmap[dateField]) : null;
      const matchesFrom =
        !createdFrom || (timelineDate && timelineDate >= new Date(`${createdFrom}T00:00:00`));

      return (
        matchesSearch && matchesRole && matchesProgress && matchesCompletion(roadmap) && matchesFrom
      );
    });

  const sortRoadmaps = (sourceRoadmaps, dateField = 'createdAt') =>
    [...sourceRoadmaps].sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a[dateField]) - new Date(b[dateField]);
      }
      if (sortBy === 'completion-high') {
        return (b.completionPercentage || 0) - (a.completionPercentage || 0);
      }
      if (sortBy === 'completion-low') {
        return (a.completionPercentage || 0) - (b.completionPercentage || 0);
      }
      return new Date(b[dateField]) - new Date(a[dateField]);
    });

  const filteredRoadmaps = sortRoadmaps(filterRoadmaps(activeRoadmaps, 'createdAt'), 'createdAt');
  const filteredCompletedRoadmaps = sortRoadmaps(
    filterRoadmaps(completedRoadmaps, 'createdAt'),
    'createdAt'
  );
  const filteredDeletedRoadmaps = sortRoadmaps(
    filterRoadmaps(deletedRoadmaps, 'deletedAt'),
    'deletedAt'
  );

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setCompletionFilter('all');
    setProgressFilter('all');
    setCreatedFrom('');
    setSortBy('newest');
  };

  const refreshDashboardData = async () => {
    const [roadmapsRes, deletedRes, statsRes] = await Promise.all([
      api.get('/roadmaps'),
      api.get('/roadmaps/deleted'),
      api.get('/roadmaps/stats'),
    ]);
    setRoadmaps(roadmapsRes.data.roadmaps || []);
    setDeletedRoadmaps(deletedRes.data.roadmaps || []);
    setStats(statsRes.data.stats);
  };

  const handleRecoverRoadmap = async (deletedId) => {
    try {
      await api.post(`/roadmaps/deleted/${deletedId}/recover`);
      await refreshDashboardData();
    } catch (error) {
      console.error('Failed to recover roadmap:', error);
    }
  };

  const handlePermanentDeleteRoadmap = async (deletedId) => {
    if (!window.confirm('Permanently delete this roadmap? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/roadmaps/deleted/${deletedId}/permanent`);
      await refreshDashboardData();
    } catch (error) {
      console.error('Failed to permanently delete roadmap:', error);
    }
  };

  const handlePreviewDeletedRoadmap = async (deletedId) => {
    setPreviewLoading(true);
    try {
      const res = await api.get(`/roadmaps/deleted/${deletedId}`);
      setPreviewRoadmap(res.data.roadmap || null);
    } catch (error) {
      console.error('Failed to preview deleted roadmap:', error);
    } finally {
      setPreviewLoading(false);
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

        {roadmaps.length > 0 || deletedRoadmaps.length > 0 ? (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={activeTab === 'active' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('active')}
              >
                Active Roadmaps ({activeRoadmaps.length})
              </Button>
              <Button
                type="button"
                variant={activeTab === 'completed' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('completed')}
              >
                Completed Roadmaps ({completedRoadmaps.length})
              </Button>
              <Button
                type="button"
                variant={activeTab === 'deleted' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('deleted')}
              >
                Deleted Roadmaps ({deletedRoadmaps.length})
              </Button>
            </div>

            {activeTab === 'active' ? (
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

                {/* Overall Progress Tracker */}
                <Card className="mb-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Overall Learning Progress</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {Math.round(stats?.averageCompletion || 0)}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(stats?.averageCompletion || 0)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Average completion across all your roadmaps.
                  </p>
                </Card>

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

                  {/* Filters */}
                  <Card>
                    <div className="grid md:grid-cols-6 gap-3">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search roadmap or role"
                        className="md:col-span-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />

                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="all">All roles</option>
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>

                      <select
                        value={completionFilter}
                        onChange={(e) => setCompletionFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="all">All completion</option>
                        <option value="0-25">0% - 25%</option>
                        <option value="26-50">26% - 50%</option>
                        <option value="51-75">51% - 75%</option>
                        <option value="76-100">76% - 100%</option>
                      </select>

                      <select
                        value={progressFilter}
                        onChange={(e) => setProgressFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="all">All progress</option>
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>

                      <input
                        type="date"
                        value={createdFrom}
                        onChange={(e) => setCreatedFrom(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        title="Created from"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="newest">Sort: Newest first</option>
                        <option value="oldest">Sort: Oldest first</option>
                        <option value="completion-high">Sort: Completion high to low</option>
                        <option value="completion-low">Sort: Completion low to high</option>
                      </select>

                      <Button type="button" variant="outline" onClick={clearFilters}>
                        Reset Filters
                      </Button>

                      <span className="text-sm text-gray-600">
                        Showing {filteredRoadmaps.length} of {activeRoadmaps.length}
                      </span>
                    </div>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredRoadmaps.map((roadmap) => {
                      const { completedDays, totalDays } = getRoadmapDayStats(roadmap);
                      const progressCategory = getProgressCategory(roadmap);
                      return (
                        <Card
                          key={roadmap._id}
                          className="hover:shadow-lg transition-shadow duration-200"
                        >
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {roadmap.roadmapName || `${roadmap.roleName} Roadmap`}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">{roadmap.roleName}</p>
                                <p className="text-sm text-gray-500">
                                  Created{' '}
                                  {new Date(roadmap.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                              <Badge variant={getStatusVariant(roadmap.status)}>
                                {roadmap.status}
                              </Badge>
                            </div>

                            <div>
                              <Badge variant={getProgressCategoryBadgeVariant(progressCategory)}>
                                {getProgressCategoryLabel(progressCategory)}
                              </Badge>
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
                              <p className="text-xs text-gray-500 mt-2">
                                {completedDays}/{totalDays || 0} days completed
                              </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Phases</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {roadmap.totalPhases || roadmap.phases?.length || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Days</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {totalDays || 0}
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
                      );
                    })}
                  </div>

                  {filteredRoadmaps.length === 0 && (
                    <Card>
                      <p className="text-sm text-gray-600">
                        No roadmaps match the current filters. Try resetting filters or changing
                        search criteria.
                      </p>
                    </Card>
                  )}
                </div>
              </>
            ) : activeTab === 'completed' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Completed Roadmaps</h2>
                  <p className="text-sm text-gray-600">Roadmaps finished by you</p>
                </div>

                <Card>
                  <div className="grid md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search roadmap or role"
                      className="md:col-span-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />

                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="all">All roles</option>
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={createdFrom}
                      onChange={(e) => setCreatedFrom(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      title="Created from"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="newest">Sort: Newest first</option>
                      <option value="oldest">Sort: Oldest first</option>
                      <option value="completion-high">Sort: Completion high to low</option>
                      <option value="completion-low">Sort: Completion low to high</option>
                    </select>

                    <Button type="button" variant="outline" onClick={clearFilters}>
                      Reset Filters
                    </Button>

                    <span className="text-sm text-gray-600">
                      Showing {filteredCompletedRoadmaps.length} of {completedRoadmaps.length}
                    </span>
                  </div>
                </Card>

                {filteredCompletedRoadmaps.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredCompletedRoadmaps.map((roadmap) => (
                      <Card
                        key={roadmap._id}
                        className="hover:shadow-lg transition-shadow duration-200"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {roadmap.roadmapName || `${roadmap.roleName} Roadmap`}
                              </h3>
                              <p className="text-sm text-gray-600 mb-1">{roadmap.roleName}</p>
                              <p className="text-sm text-gray-500">
                                Created{' '}
                                {new Date(roadmap.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <Badge variant="success">Completed</Badge>
                          </div>

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
                ) : (
                  <Card>
                    <p className="text-sm text-gray-600">
                      No completed roadmaps match the current filters.
                    </p>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Deleted Roadmaps</h2>
                  <p className="text-sm text-gray-600">Recover or permanently delete roadmaps</p>
                </div>

                <Card>
                  <div className="grid md:grid-cols-6 gap-3">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search roadmap or role"
                      className="md:col-span-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />

                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="all">All roles</option>
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>

                    <select
                      value={completionFilter}
                      onChange={(e) => setCompletionFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="all">All completion</option>
                      <option value="0-25">0% - 25%</option>
                      <option value="26-50">26% - 50%</option>
                      <option value="51-75">51% - 75%</option>
                      <option value="76-100">76% - 100%</option>
                    </select>

                    <select
                      value={progressFilter}
                      onChange={(e) => setProgressFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="all">All progress</option>
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <input
                      type="date"
                      value={createdFrom}
                      onChange={(e) => setCreatedFrom(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      title="Deleted from"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="newest">Sort: Newest first</option>
                      <option value="oldest">Sort: Oldest first</option>
                      <option value="completion-high">Sort: Completion high to low</option>
                      <option value="completion-low">Sort: Completion low to high</option>
                    </select>

                    <Button type="button" variant="outline" onClick={clearFilters}>
                      Reset Filters
                    </Button>

                    <span className="text-sm text-gray-600">
                      Showing {filteredDeletedRoadmaps.length} of {deletedRoadmaps.length}
                    </span>
                  </div>
                </Card>

                {filteredDeletedRoadmaps.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredDeletedRoadmaps.map((roadmap) => (
                      <Card
                        key={roadmap._id}
                        className="hover:shadow-lg transition-shadow duration-200"
                      >
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {roadmap.roadmapName || `${roadmap.roleName} Roadmap`}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">{roadmap.roleName}</p>
                            <p className="text-sm text-gray-500">
                              Deleted{' '}
                              {new Date(roadmap.deletedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>

                          <div className="text-sm text-gray-600">
                            Completion: {Math.round(roadmap.completionPercentage || 0)}%
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handlePreviewDeletedRoadmap(roadmap._id)}
                              disabled={previewLoading}
                            >
                              Preview
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleRecoverRoadmap(roadmap._id)}
                            >
                              Recover
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => handlePermanentDeleteRoadmap(roadmap._id)}
                            >
                              Delete Permanently
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <p className="text-sm text-gray-600">
                      No deleted roadmaps match the current filters.
                    </p>
                  </Card>
                )}
              </div>
            )}
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

        {previewRoadmap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-2xl max-h-[85vh] overflow-auto">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {previewRoadmap.roadmapName || `${previewRoadmap.roleName} Roadmap`}
                    </h3>
                    <p className="text-sm text-gray-600">{previewRoadmap.roleName}</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setPreviewRoadmap(null)}>
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Completion</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {Math.round(previewRoadmap.completionPercentage || 0)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Daily Minutes</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {previewRoadmap.dailyLearningMinutes || '-'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Phases</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {previewRoadmap.roadmapData?.totalPhases ||
                        previewRoadmap.roadmapData?.phases?.length ||
                        0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Days</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {previewRoadmap.roadmapData?.totalDays ||
                        (previewRoadmap.roadmapData?.phases || []).reduce(
                          (sum, phase) => sum + (phase.days?.length || 0),
                          0
                        )}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-800 mb-2">Preview Summary</p>
                  {(previewRoadmap.roadmapData?.phases || []).slice(0, 3).map((phase) => (
                    <p key={phase.phaseNumber} className="text-sm text-gray-700 mb-1">
                      Phase {phase.phaseNumber}: {phase.phaseName} ({phase.days?.length || 0} days)
                    </p>
                  ))}
                  {(previewRoadmap.roadmapData?.phases || []).length === 0 && (
                    <p className="text-sm text-gray-600">No phase preview data available.</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
