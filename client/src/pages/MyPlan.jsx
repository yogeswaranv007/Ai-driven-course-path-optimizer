import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import SkillGapChart from '../components/SkillGapChart.jsx';

const MyPlan = () => {
  const [plan, setPlan] = useState(null);
  const [skillGaps, setSkillGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [error, setError] = useState('');

  // All hooks MUST be before any early returns
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await api.get('/plans/my');
        const latest = res.data.plans?.[0];
        setPlan(latest);
        setSkillGaps(latest?.skillGaps || []);
      } catch (error) {
        console.error('Failed to fetch plan:', error);
        setError(error.response?.data?.error || 'Failed to load plan');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

  // Initialize activeDay when plan loads
  useEffect(() => {
    if (plan?.weeks?.[activeWeek - 1]?.days?.[0] && !activeDay) {
      setActiveDay(plan.weeks[activeWeek - 1].days[0].dayNumber);
    }
  }, [plan, activeWeek]); // Remove activeDay from dependency to avoid loops

  const handleTaskStatusUpdate = async (task, status) => {
    const roadmapId = plan?.roadmapMetadata?.roadmapId;
    if (!roadmapId) {
      setError('This plan is not linked to a roadmap instance, so task sync is unavailable.');
      return;
    }

    const taskId = task.taskKey || task.taskId;
    if (!taskId) {
      setError('Task identifier is missing. Unable to update status.');
      return;
    }

    setUpdatingTask(taskId);
    setError('');

    try {
      await api.patch(
        `/roadmaps/${encodeURIComponent(roadmapId)}/tasks/${encodeURIComponent(taskId)}`,
        {
          status,
        }
      );

      setPlan((prev) => {
        if (!prev?.weeks) return prev;
        return {
          ...prev,
          weeks: prev.weeks.map((week) => ({
            ...week,
            days: (week.days || []).map((day) => ({
              ...day,
              tasks: (day.tasks || []).map((item) => {
                const isTarget = (item.taskKey || item.taskId) === taskId;
                if (!isTarget) return item;
                return {
                  ...item,
                  status,
                  completedAt: status === 'completed' ? new Date().toISOString() : null,
                };
              }),
            })),
          })),
        };
      });
    } catch (updateError) {
      console.error('Failed to update task status:', updateError);
      const message =
        updateError.response?.data?.error ||
        updateError.response?.data?.details ||
        'Failed to update task status';
      setError(message);
    } finally {
      setUpdatingTask(null);
    }
  };

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Card>
            <EmptyState
              title="No Active Plan"
              description="Create your first learning plan to get started with your personalized learning journey."
              action={
                <a href="/generate-plan">
                  <Button variant="primary">Generate Plan</Button>
                </a>
              }
            />
          </Card>
        </div>
      </div>
    );
  }

  // Derived state (OK after early returns)
  const currentWeek = plan.weeks?.[activeWeek - 1];
  const weekNumbers = plan.weeks?.map((w) => w.weekNumber) || [];
  const currentDay =
    currentWeek?.days?.find((d) => d.dayNumber === activeDay) || currentWeek?.days?.[0];

  const getTaskBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTaskStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Learning Plan</h1>
          <p className="text-gray-600">
            Track your progress and complete your personalized learning journey
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Skill Gap Chart */}
        {skillGaps.length > 0 && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Skill Gaps to Improve</h3>
            <SkillGapChart data={skillGaps} />
          </Card>
        )}

        {/* Week Tabs */}
        {weekNumbers.length > 0 && (
          <Card className="mb-8">
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {weekNumbers.map((week) => (
                  <button
                    key={week}
                    onClick={() => setActiveWeek(week)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeWeek === week
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Week {week}
                  </button>
                ))}
              </div>
            </div>

            {/* Week Content */}
            {currentWeek && (
              <div className="space-y-8">
                {/* AI-Generated Week Overview */}
                {currentWeek.aiContent && (
                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">✨</span>
                      <div>
                        <h4 className="font-semibold text-amber-900">
                          AI-Powered Learning Resources for Week {activeWeek}
                        </h4>
                        <p className="text-sm text-amber-700 mt-1">{currentWeek.aiContent.topic}</p>
                      </div>
                    </div>

                    {/* Why this week matters */}
                    {currentWeek.aiContent.why && (
                      <div className="mb-4 p-3 bg-white border border-amber-100 rounded">
                        <p className="text-xs font-semibold text-amber-900 mb-1">
                          Why This Week Matters
                        </p>
                        <p className="text-sm text-amber-800">{currentWeek.aiContent.why}</p>
                      </div>
                    )}

                    {/* AI Suggested Tasks */}
                    {currentWeek.aiContent.tasks && currentWeek.aiContent.tasks.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-amber-900 mb-2">
                          📚 Key Learning Tasks
                        </p>
                        <div className="space-y-2">
                          {currentWeek.aiContent.tasks.slice(0, 3).map((aiTask, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-sm p-2 bg-white border border-amber-100 rounded"
                            >
                              <span className="text-amber-600 font-semibold">{idx + 1}.</span>
                              <div className="flex-1">
                                <p className="font-medium text-amber-900">{aiTask.title}</p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  {aiTask.description}
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                  ⏱️ {aiTask.durationMinutes} min • {aiTask.difficulty}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Suggested Exercises */}
                    {currentWeek.aiContent.exercises &&
                      currentWeek.aiContent.exercises.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-amber-900 mb-2">
                            💪 Hands-On Exercises
                          </p>
                          <div className="space-y-2">
                            {currentWeek.aiContent.exercises.slice(0, 2).map((exercise, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-sm p-2 bg-white border border-amber-100 rounded"
                              >
                                <span className="text-amber-600 font-semibold">{idx + 1}.</span>
                                <div className="flex-1">
                                  <p className="font-medium text-amber-900">{exercise.title}</p>
                                  <p className="text-xs text-amber-700 mt-0.5">
                                    {exercise.description}
                                  </p>
                                  <p className="text-xs text-amber-600 mt-1">
                                    ⏱️ {exercise.durationMinutes} min
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* AI Suggested Project */}
                    {currentWeek.aiContent.project && (
                      <div className="p-3 bg-white border border-amber-100 rounded">
                        <p className="text-xs font-semibold text-amber-900 mb-2">🚀 Mini-Project</p>
                        <div>
                          <p className="font-medium text-amber-900">
                            {currentWeek.aiContent.project.title}
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            {currentWeek.aiContent.project.description}
                          </p>
                          <p className="text-xs text-amber-600 mt-2">
                            ⏱️ {currentWeek.aiContent.project.durationMinutes} min
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Day Tabs */}
                {currentWeek.days && currentWeek.days.length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex gap-1 overflow-x-auto">
                      {currentWeek.days.map((day) => (
                        <button
                          key={day.dayNumber}
                          onClick={() => setActiveDay(day.dayNumber)}
                          className={`px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                            activeDay === day.dayNumber
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Day {day.dayNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Day Tasks */}
                {currentDay ? (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Day {currentDay.dayNumber} Tasks
                    </h4>
                    {currentDay.tasks && currentDay.tasks.length > 0 ? (
                      <div className="space-y-3">
                        {currentDay.tasks.map((task, idx) => (
                          <div
                            key={idx}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="font-medium text-gray-900">{task.title}</h5>
                                  {task.topic && <Badge variant="primary">{task.topic}</Badge>}
                                  <Badge variant={getTaskBadgeColor(task.status)}>
                                    {getTaskStatusLabel(task.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Estimated time: {task.durationMinutes} minutes
                                </p>

                                {/* Expandable Explanation - Now uses task.reason */}
                                {task.reason && (
                                  <button
                                    onClick={() =>
                                      setExpandedTask(
                                        expandedTask === task.taskKey ? null : task.taskKey
                                      )
                                    }
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                  >
                                    {expandedTask === task.taskKey ? '▼ Hide' : '▶ Why this task?'}
                                  </button>
                                )}
                              </div>

                              {/* Mark Complete Button */}
                              <Button
                                variant={task.status === 'completed' ? 'secondary' : 'primary'}
                                size="sm"
                                disabled={
                                  updatingTask === (task.taskKey || task.taskId) ||
                                  task.status === 'completed'
                                }
                                onClick={() => handleTaskStatusUpdate(task, 'completed')}
                              >
                                {updatingTask === (task.taskKey || task.taskId)
                                  ? 'Updating...'
                                  : task.status === 'completed'
                                    ? 'Completed'
                                    : 'Mark Complete'}
                              </Button>
                            </div>

                            {/* Explanation - From task.reason */}
                            {expandedTask === task.taskKey && task.reason && (
                              <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                                <p className="text-xs font-semibold text-sky-900 mb-2">
                                  Why this task?
                                </p>
                                <p className="text-xs text-sky-800">{task.reason}</p>
                              </div>
                            )}

                            {/* Resources */}
                            {task.resourceLinks && task.resourceLinks.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-600 mb-2">
                                  Resources
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {task.resourceLinks.map((res, ridx) => (
                                    <a
                                      key={ridx}
                                      href={res.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                    >
                                      {res.title}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No tasks for this day</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">No days available</p>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyPlan;
