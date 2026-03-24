import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

const RoadmapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.generationNotice || '');
  const [expandedWeeks, setExpandedWeeks] = useState(new Set([1])); // First week expanded by default
  const [expandedPhases, setExpandedPhases] = useState(new Set([1]));
  const [updatingTask, setUpdatingTask] = useState(null);
  const [updatingPhase, setUpdatingPhase] = useState(null);
  const [loadingDay, setLoadingDay] = useState(null);

  const hasVisibleDayContent = (day) => {
    if (!day?.content) return false;

    const hasObjectives =
      Array.isArray(day.content.learningObjectives) && day.content.learningObjectives.length > 0;
    const hasWhyImportant = Boolean(String(day.content.whyImportant || '').trim());
    const hasPracticeTask = Boolean(String(day.content.practiceTask?.title || '').trim());
    const hasResources = Array.isArray(day.content.resources) && day.content.resources.length > 0;

    return hasObjectives || hasWhyImportant || hasPracticeTask || hasResources;
  };

  useEffect(() => {
    fetchRoadmap();
  }, [id]);

  const fetchRoadmap = async () => {
    try {
      const res = await api.get(`/roadmaps/${id}`);
      setRoadmap(res.data.roadmap);
    } catch (error) {
      console.error('Failed to fetch roadmap:', error);
      setError(error.response?.data?.message || 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (weekNumber) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNumber)) {
        next.delete(weekNumber);
      } else {
        next.add(weekNumber);
      }
      return next;
    });
  };

  const togglePhase = (phaseNumber) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseNumber)) {
        next.delete(phaseNumber);
      } else {
        next.add(phaseNumber);
      }
      return next;
    });
  };

  const handleGenerateDayContent = async (dayNumber) => {
    setLoadingDay(dayNumber);
    setError('');

    try {
      const res = await api.get(`/roadmaps/${id}/days/${dayNumber}`);
      const updatedDay = res.data.day;

      setRoadmap((prev) => {
        if (!prev?.phases) return prev;
        const nextPhases = prev.phases.map((phase) => ({
          ...phase,
          days: (phase.days || []).map((day) =>
            day.dayNumber === dayNumber
              ? {
                  ...day,
                  contentStatus: updatedDay.contentStatus,
                  content: updatedDay.content,
                }
              : day
          ),
        }));
        return {
          ...prev,
          phases: nextPhases,
        };
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.details ||
          'Failed to generate day content. Please try again.'
      );
    } finally {
      setLoadingDay(null);
    }
  };

  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    setUpdatingTask(taskId);
    setError('');

    try {
      await api.patch(`/roadmaps/${id}/tasks/${taskId}`, { status: newStatus });

      // Refresh roadmap to get updated completion percentage
      await fetchRoadmap();
    } catch (error) {
      console.error('Failed to update task:', error);
      setError(error.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingTask(null);
    }
  };

  const handlePhaseBulkStatusUpdate = async (phase, newStatus) => {
    const targetDayNumbers = (phase.days || [])
      .filter((day) => {
        if (newStatus === 'completed') return day.status !== 'completed';
        return day.status === 'completed';
      })
      .map((day) => day.dayNumber);

    if (targetDayNumbers.length === 0) {
      return;
    }

    setUpdatingPhase(`${phase.phaseNumber}-${newStatus}`);
    setError('');

    try {
      for (const dayNumber of targetDayNumbers) {
        await api.patch(`/roadmaps/${id}/tasks/day-${dayNumber}`, { status: newStatus });
      }
      await fetchRoadmap();
    } catch (updateError) {
      console.error('Failed to bulk update phase days:', updateError);
      setError(updateError.response?.data?.message || 'Failed to update days in this phase');
    } finally {
      setUpdatingPhase(null);
    }
  };

  const handleDeleteRoadmap = async () => {
    if (
      !window.confirm('Are you sure you want to delete this roadmap? This action cannot be undone.')
    ) {
      return;
    }

    try {
      await api.delete(`/roadmaps/${id}`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete roadmap:', error);
      setError(error.response?.data?.message || 'Failed to delete roadmap');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDayStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'in-progress':
        return (
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !roadmap) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <ErrorBanner message={error} />
          <div className="mt-6">
            <Link to="/dashboard">
              <Button variant="secondary">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="secondary">
              <svg
                className="w-4 h-4 mr-2 inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Error Message */}
        {notice && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Roadmap Header Card */}
        <Card className="mb-8">
          <div className="space-y-6">
            {/* Title & Status */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{roadmap.roleName}</h1>
                <p className="text-gray-600">
                  Created on{' '}
                  {new Date(roadmap.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <Badge variant={roadmap.status === 'active' ? 'success' : 'default'}>
                {roadmap.status}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Overall Progress</span>
                <span className="font-semibold text-gray-900">
                  {Math.round(roadmap.completionPercentage || 0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${roadmap.completionPercentage || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Phases</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roadmap.totalPhases || roadmap.phases?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Daily Learning</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roadmap.dailyLearningMinutes} min
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{roadmap.estimatedTotalHours}h</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Est. Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roadmap.estimatedCompletionDays}
                </p>
              </div>
            </div>

            {/* Skills Used */}
            {roadmap.skillsUsed && roadmap.skillsUsed.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Skills in this roadmap:</p>
                <div className="flex flex-wrap gap-2">
                  {roadmap.skillsUsed.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                    >
                      {skill.name} • {skill.level}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button variant="danger" onClick={handleDeleteRoadmap} className="text-sm">
                Delete Roadmap
              </Button>
            </div>
          </div>
        </Card>

        {/* Learning Content */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Learning Path</h2>

          {roadmap.phases && roadmap.phases.length > 0
            ? roadmap.phases.map((phase) => (
                <Card key={phase.phaseNumber} className="overflow-hidden">
                  <button
                    onClick={() => togglePhase(phase.phaseNumber)}
                    className="w-full text-left flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Phase {phase.phaseNumber}: {phase.phaseName}
                        </h3>
                        <Badge variant="default">{phase.days?.length || 0} days</Badge>
                      </div>
                      <p className="text-sm text-gray-700">{phase.goal}</p>
                    </div>
                    <svg
                      className={`w-6 h-6 text-gray-400 transition-transform ${
                        expandedPhases.has(phase.phaseNumber) ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {expandedPhases.has(phase.phaseNumber) && (
                    <div className="px-6 pb-6 border-t border-gray-100 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                        <p className="text-sm text-gray-600">
                          {(phase.days || []).filter((d) => d.status === 'completed').length}/
                          {phase.days?.length || 0} days completed in this phase
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            disabled={updatingPhase === `${phase.phaseNumber}-completed`}
                            onClick={() => handlePhaseBulkStatusUpdate(phase, 'completed')}
                          >
                            {updatingPhase === `${phase.phaseNumber}-completed`
                              ? 'Marking...'
                              : 'Complete All Days'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updatingPhase === `${phase.phaseNumber}-pending`}
                            onClick={() => handlePhaseBulkStatusUpdate(phase, 'pending')}
                          >
                            {updatingPhase === `${phase.phaseNumber}-pending`
                              ? 'Undoing...'
                              : 'Undo All Days'}
                          </Button>
                        </div>
                      </div>

                      {(phase.days || []).map((day) => (
                        <div
                          key={day.dayNumber}
                          className="border rounded-lg p-4 bg-white border-gray-200"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                Day {day.dayNumber}: {day.topic}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {day.estimatedMinutes} minutes
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getDayStatusBadgeVariant(day.status)}>
                                {day.status || 'pending'}
                              </Badge>
                              <Button
                                type="button"
                                size="sm"
                                variant={day.status === 'completed' ? 'outline' : 'primary'}
                                disabled={updatingTask === `day-${day.dayNumber}`}
                                onClick={() =>
                                  handleTaskStatusUpdate(
                                    `day-${day.dayNumber}`,
                                    day.status === 'completed' ? 'pending' : 'completed'
                                  )
                                }
                              >
                                {updatingTask === `day-${day.dayNumber}`
                                  ? 'Updating...'
                                  : day.status === 'completed'
                                    ? 'Undo'
                                    : 'Complete'}
                              </Button>
                            </div>
                          </div>

                          {hasVisibleDayContent(day) ? (
                            <div className="mt-4 space-y-3">
                              {day.content?.learningObjectives?.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-800 mb-1">Study</p>
                                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {day.content.learningObjectives.map((obj, idx) => (
                                      <li key={idx}>{obj}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {day.content?.whyImportant && (
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">Why this matters:</span>{' '}
                                  {day.content.whyImportant}
                                </div>
                              )}

                              {day.content?.resources?.length > 0 && (
                                <div className="space-y-3">
                                  {day.content.resources.filter(
                                    (resource) => resource.type === 'documentation'
                                  ).length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-800 mb-1">Docs</p>
                                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        {day.content.resources
                                          .filter((resource) => resource.type === 'documentation')
                                          .map((resource, index) => (
                                            <li key={`doc-${index}`}>
                                              <a
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-800 underline"
                                              >
                                                {resource.title}
                                              </a>
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  )}

                                  {day.content.resources.filter(
                                    (resource) => resource.type === 'youtube'
                                  ).length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-800 mb-1">
                                        Videos
                                      </p>
                                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        {day.content.resources
                                          .filter((resource) => resource.type === 'youtube')
                                          .map((resource, index) => (
                                            <li key={`video-${index}`}>
                                              {resource.url ? (
                                                <a
                                                  href={resource.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-indigo-600 hover:text-indigo-800 underline"
                                                >
                                                  {resource.title}
                                                  {resource.channelName
                                                    ? ` — ${resource.channelName}`
                                                    : ''}
                                                </a>
                                              ) : (
                                                <span>
                                                  {resource.title}
                                                  {resource.channelName
                                                    ? ` — ${resource.channelName}`
                                                    : ''}
                                                </span>
                                              )}
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {day.content.practiceTask?.title && (
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">Practice:</span>{' '}
                                  {day.content.practiceTask.title}
                                  {day.content.practiceTask.description
                                    ? ` — ${day.content.practiceTask.description}`
                                    : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-4 flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                Content: {day.contentStatus || 'not-generated'}
                              </span>
                              <Button
                                type="button"
                                onClick={() => handleGenerateDayContent(day.dayNumber)}
                                disabled={loadingDay === day.dayNumber}
                              >
                                {loadingDay === day.dayNumber
                                  ? 'Generating...'
                                  : 'Generate Day Content'}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            : null}

          {(!roadmap.phases || roadmap.phases.length === 0) &&
            roadmap.weeks &&
            roadmap.weeks.map((week) => (
              <Card key={week.weekNumber} className="overflow-hidden">
                {/* Week Header - Clickable */}
                <button
                  onClick={() => toggleWeek(week.weekNumber)}
                  className="w-full text-left flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Week {week.weekNumber}: {week.topic}
                      </h3>
                      <Badge variant="default">{week.tasks?.length || 0} tasks</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{week.totalMinutes} minutes of learning</p>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${
                      expandedWeeks.has(week.weekNumber) ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Week Content - Collapsible */}
                {expandedWeeks.has(week.weekNumber) && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    {/* AI Content */}
                    {week.aiContent && (
                      <div className="mt-6 mb-6 p-4 bg-indigo-50 rounded-lg">
                        <h4 className="font-semibold text-indigo-900 mb-2">
                          🎯 Why This Week Matters
                        </h4>
                        <p className="text-sm text-indigo-800 mb-4">{week.aiContent.why}</p>

                        {week.aiContent.keyTakeaways && week.aiContent.keyTakeaways.length > 0 && (
                          <>
                            <h5 className="font-semibold text-indigo-900 mb-2 text-sm">
                              Key Takeaways:
                            </h5>
                            <ul className="list-disc list-inside space-y-1 text-sm text-indigo-800">
                              {week.aiContent.keyTakeaways.map((takeaway, index) => (
                                <li key={index}>{takeaway}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}

                    {/* Tasks List */}
                    <div className="space-y-4">
                      {week.tasks &&
                        week.tasks.map((task) => (
                          <div
                            key={task.taskId}
                            className={`border rounded-lg p-4 ${
                              task.status === 'completed'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            {/* Task Header */}
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() =>
                                  handleTaskStatusUpdate(
                                    task.taskId,
                                    task.status === 'completed' ? 'pending' : 'completed'
                                  )
                                }
                                disabled={updatingTask === task.taskId}
                                className="mt-1 flex-shrink-0 transition-transform hover:scale-110 disabled:opacity-50"
                              >
                                {getTaskStatusIcon(task.status)}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h4
                                    className={`font-semibold ${task.status === 'completed' ? 'text-green-900' : 'text-gray-900'}`}
                                  >
                                    {task.title}
                                  </h4>
                                  <span
                                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}
                                  >
                                    {task.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-3">{task.description}</p>

                                {/* Task Meta */}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                  <span>⏱️ {task.estimatedMinutes} minutes</span>
                                  <span>📚 {task.skill}</span>
                                  {task.dayNumber && <span>Day {task.dayNumber}</span>}
                                </div>

                                {/* Reason */}
                                {task.reason && (
                                  <div className="mb-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                                    <span className="font-medium">Why: </span>
                                    {task.reason}
                                  </div>
                                )}

                                {/* Resources */}
                                {task.resources && task.resources.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                      📖 Resources:
                                    </p>
                                    <ul className="space-y-1">
                                      {task.resources.map((resource, index) => (
                                        <li key={index}>
                                          <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                                          >
                                            {resource.title} {resource.type && `(${resource.type})`}
                                          </a>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Exercise */}
                                {task.exercise && (
                                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-sm font-medium text-yellow-900 mb-1">
                                      🎯 Exercise
                                    </p>
                                    <p className="text-sm text-yellow-800 mb-2">
                                      {task.exercise.description}
                                    </p>
                                    {task.exercise.expectedOutcome && (
                                      <p className="text-xs text-yellow-700">
                                        <span className="font-medium">Expected Outcome: </span>
                                        {task.exercise.expectedOutcome}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapDetail;
