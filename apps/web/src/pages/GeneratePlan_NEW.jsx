import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import Select from '../components/ui/Select.jsx';
import Card from '../components/ui/Card.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

const SKILLS = [
  'JavaScript Basics',
  'React',
  'Node.js',
  'MongoDB',
  'HTML & CSS',
  'TypeScript',
  'Database Design',
  'REST APIs',
  'Authentication',
];

const PROFICIENCY_LEVELS = [
  { label: 'None', value: 0 },
  { label: 'Beginner', value: 1 },
  { label: 'Basic', value: 2 },
  { label: 'Intermediate', value: 3 },
  { label: 'Advanced', value: 4 },
  { label: 'Expert', value: 5 },
];

const GeneratePlan = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState([{ skill: '', proficiency: 2 }]);

  // Planning Mode State
  const [planningMode, setPlanningMode] = useState('DAILY_HOURS');
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [targetDays, setTargetDays] = useState('');

  const [goal, setGoal] = useState('Skill Development');
  const [error, setError] = useState('');
  const [advisoryMessage, setAdvisoryMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSkill = () => {
    if (skills.length < SKILLS.length) {
      setSkills([...skills, { skill: '', proficiency: 2 }]);
    }
  };

  const handleRemoveSkill = (idx) => {
    if (skills.length > 1) {
      setSkills(skills.filter((_, i) => i !== idx));
    }
  };

  const handleSkillChange = (idx, field, value) => {
    const updated = [...skills];
    updated[idx][field] = value;
    setSkills(updated);
  };

  const validateStep = () => {
    if (step === 1) {
      if (skills.some((s) => !s.skill)) {
        setError('Please select a skill for all entries');
        return false;
      }
    }
    if (step === 2) {
      if (hoursPerDay < 0.25 || hoursPerDay > 24) {
        setError('Hours per day must be between 0.25 and 24');
        return false;
      }

      if (planningMode === 'DEADLINE_DAYS') {
        if (!targetDays || targetDays <= 0) {
          setError('Target days is required for deadline mode and must be a positive number');
          return false;
        }
      }
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    setError('');
    setAdvisoryMessage('');

    try {
      const payload = {
        skills: skills.map((s) => ({
          topic: s.skill,
          level: s.proficiency,
        })),
        marks: skills.map((s) => ({
          topic: s.skill,
          scorePercent: s.proficiency * 20,
        })),
        goal,
        planningMode,
        hoursPerDay: Number(hoursPerDay),
      };

      // Only include targetDays if provided or required
      if (targetDays && targetDays > 0) {
        payload.targetDays = Number(targetDays);
      }

      const response = await api.post('/plans/generate', payload);

      // Check for advisory messages or infeasibility
      if (response.data.planMetadata) {
        const metadata = response.data.planMetadata;

        if (metadata.advisoryMessage) {
          setAdvisoryMessage(metadata.advisoryMessage);
        }

        // Show results even if there's an advisory
        if (response.data.plan) {
          // Store metadata for dashboard display
          sessionStorage.setItem('lastPlanMetadata', JSON.stringify(metadata));
          navigate('/my-plan');
        }
      } else if (response.data.plan) {
        navigate('/my-plan');
      }
    } catch (err) {
      console.error('Plan generation error:', err);

      // Handle specific error types
      if (err.response?.data) {
        const errData = err.response.data;

        if (errData.error === 'INSUFFICIENT_TIME_PHYSICAL') {
          setError(
            `⚠️ Physically Impossible: ${errData.message || 'Even at 24 hours/day, the deadline cannot be met.'}\n` +
              `Minimum days needed (at 24h/day): ${errData.minimumDaysAt24Hours || 'N/A'}`
          );
        } else if (errData.error === 'INSUFFICIENT_TIME_PACE') {
          setError(
            `⏰ Pace Too Slow: ${errData.message || 'Your current pace is not sufficient.'}\n` +
              `Required hours per day: ${errData.requiredHoursPerDay || 'N/A'}`
          );
        } else if (errData.error === 'VALIDATION_ERROR') {
          setError(`Validation Error: ${errData.message || 'Invalid input'}`);
        } else {
          setError(errData.message || errData.error || 'Failed to generate plan');
        }
      } else {
        setError('Failed to generate plan. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Build Your Learning Path</h1>
          <p className="text-lg text-gray-600">
            Tell us about your skills and goals for a personalized intelligent roadmap
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 mx-1">
                <div
                  className={`h-2 rounded-full transition-colors ${s <= step ? 'bg-indigo-600' : 'bg-gray-200'}`}
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {step} of 3:{' '}
            {step === 1
              ? 'Your Skills'
              : step === 2
                ? 'Planning Mode & Timeline'
                : 'Review & Generate'}
          </p>
        </div>

        {error && <ErrorBanner message={error} onDismiss={() => setError('')} className="mb-6" />}

        {advisoryMessage && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 text-yellow-900 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">⚠️ Advisory: {advisoryMessage}</p>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Skills */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    What skills do you have?
                  </h2>
                  <div className="space-y-4">
                    {skills.map((skill, idx) => (
                      <div key={idx} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Skill
                          </label>
                          <Select
                            options={SKILLS.map((t) => ({ label: t, value: t }))}
                            value={skill.skill}
                            onChange={(e) => handleSkillChange(idx, 'skill', e.target.value)}
                            disabled={loading}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proficiency
                          </label>
                          <Select
                            options={PROFICIENCY_LEVELS}
                            value={String(skill.proficiency)}
                            onChange={(e) =>
                              handleSkillChange(idx, 'proficiency', Number(e.target.value))
                            }
                            disabled={loading}
                          />
                        </div>
                        {skills.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(idx)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={loading}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {skills.length < SKILLS.length && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSkill}
                      disabled={loading || skills.some((s) => !s.skill)}
                      className="mt-4"
                    >
                      + Add Skill
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Planning Mode & Timeline */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Planning Mode & Timeline</h2>

                {/* Planning Mode Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Planning Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPlanningMode('DAILY_HOURS')}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        planningMode === 'DAILY_HOURS'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                      disabled={loading}
                    >
                      <div className="text-sm">📊 Daily Hours</div>
                      <div className="text-xs mt-1 opacity-75">Based on daily pace</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanningMode('DEADLINE_DAYS')}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        planningMode === 'DEADLINE_DAYS'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                      disabled={loading}
                    >
                      <div className="text-sm">🎯 Deadline</div>
                      <div className="text-xs mt-1 opacity-75">Fit within target days</div>
                    </button>
                  </div>

                  {planningMode === 'DAILY_HOURS' && (
                    <p className="text-sm text-gray-600 mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                      ℹ️ Timeline will be generated based strictly on your daily hours. Optional
                      target days will show advisory if timeline exceeds it.
                    </p>
                  )}

                  {planningMode === 'DEADLINE_DAYS' && (
                    <p className="text-sm text-gray-600 mt-2 bg-purple-50 border border-purple-200 rounded p-2">
                      ℹ️ Timeline must fit within your target deadline. System will validate
                      feasibility and show required hours/day if needed.
                    </p>
                  )}
                </div>

                {/* Hours Per Day */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Learning Time:{' '}
                    <span className="font-bold text-indigo-600">{hoursPerDay} hours/day</span>
                  </label>
                  <input
                    type="range"
                    min="0.25"
                    max="12"
                    step="0.25"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={loading}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0.25h (15min)</span>
                    <span>12h</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    {hoursPerDay < 1
                      ? '🐢 Casual pace'
                      : hoursPerDay < 3
                        ? '🚴 Steady pace'
                        : hoursPerDay < 6
                          ? '🚀 Intensive'
                          : '⚡ Maximum effort'}
                  </p>
                </div>

                {/* Target Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Days{' '}
                    {planningMode === 'DEADLINE_DAYS' && <span className="text-red-500">*</span>}
                    {planningMode === 'DAILY_HOURS' && (
                      <span className="text-gray-500 text-xs">(Optional - for advisory)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={targetDays}
                    onChange={(e) => setTargetDays(e.target.value)}
                    placeholder={planningMode === 'DAILY_HOURS' ? 'Optional' : 'Required'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {planningMode === 'DAILY_HOURS'
                      ? 'Leave empty to let timeline be determined by your daily pace'
                      : 'Your hard deadline in days'}
                  </p>
                </div>

                {/* Goal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Goal</label>
                  <Select
                    options={[
                      { label: 'Skill Development', value: 'Skill Development' },
                      { label: 'Job Preparation', value: 'Job Preparation' },
                      { label: 'Interview Prep', value: 'Interview Prep' },
                      { label: 'Project Building', value: 'Project Building' },
                    ]}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Ready to Generate Your Roadmap?
                </h2>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Your Current Skills</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.map((s, i) => (
                        <span
                          key={i}
                          className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                        >
                          {s.skill}{' '}
                          <span className="text-xs opacity-75">
                            ({PROFICIENCY_LEVELS[s.proficiency].label})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-indigo-200 pt-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Planning Mode:</span>{' '}
                      {planningMode === 'DAILY_HOURS' ? '📊 Daily Hours' : '🎯 Deadline'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Daily Learning Time:</span> {hoursPerDay}{' '}
                      hours/day
                    </p>
                    {targetDays && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Target Days:</span> {targetDays} days
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Goal:</span> {goal}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    ✨ Our intelligent system will analyze your skills, select the best learning
                    track, create a personalized timeline, and validate feasibility based on your
                    planning mode.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-6 border-t border-gray-200">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handlePrev} disabled={loading}>
                  ← Previous
                </Button>
              )}
              <div className="flex-1" />
              {step < 3 ? (
                <Button type="button" variant="primary" onClick={handleNext} disabled={loading}>
                  Next →
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="min-w-[200px]"
                >
                  {loading ? <LoadingSpinner className="inline mr-2" /> : ''}
                  Generate Roadmap
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default GeneratePlan;
