import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/ui/Button.jsx';
import Select from '../components/ui/Select.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

const COMMON_SKILLS = [
  'JavaScript',
  'Python',
  'React',
  'Node.js',
  'HTML',
  'CSS',
  'TypeScript',
  'Java',
  'MongoDB',
  'SQL',
  'Git',
  'REST APIs',
  'Docker',
  'AWS',
];

const JOB_ROLES = [
  { label: 'Frontend Developer', value: 'Frontend Developer' },
  { label: 'Backend Developer', value: 'Backend Developer' },
  { label: 'Full Stack Developer', value: 'Full Stack Developer' },
  { label: 'React Developer', value: 'React Developer' },
  { label: 'Node.js Developer', value: 'Node.js Developer' },
];

const SKILL_LEVELS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const GeneratePlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Skill source selection
  const [skillSource, setSkillSource] = useState('profile'); // 'profile' or 'custom'
  const [profileSkills, setProfileSkills] = useState([]);
  const [customSkills, setCustomSkills] = useState([{ name: '', level: 'beginner' }]);

  // Job Role & Daily Minutes State
  const [roleName, setRoleName] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(120);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    fetchProfileSkills();
  }, []);

  const fetchProfileSkills = async () => {
    try {
      const res = await api.get('/profile');
      setProfileSkills(res.data.user.skills || []);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAddSkill = () => {
    setCustomSkills([...customSkills, { name: '', level: 'beginner' }]);
  };

  const handleRemoveSkill = (idx) => {
    if (customSkills.length > 1) {
      setCustomSkills(customSkills.filter((_, i) => i !== idx));
    }
  };

  const handleSkillChange = (idx, field, value) => {
    const updated = [...customSkills];
    updated[idx][field] = value;
    setCustomSkills(updated);
  };

  const validateStep = () => {
    if (step === 1) {
      if (skillSource === 'profile' && profileSkills.length === 0) {
        setError(
          'No skills in your profile. Please add skills in Profile Settings or use Custom Skills.'
        );
        return false;
      }
      if (skillSource === 'custom') {
        if (customSkills.some((s) => !s.name.trim())) {
          setError('Please enter a name for all skills');
          return false;
        }
      }
    }
    if (step === 2) {
      if (!roleName || roleName.trim().length === 0) {
        setError('Please select a target job role');
        return false;
      }
      if (dailyMinutes < 30 || dailyMinutes > 480) {
        setError('Daily learning minutes must be between 30 and 480');
        return false;
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

    try {
      const payload = {
        roleName,
        dailyLearningMinutes: Number(dailyMinutes),
        skillSource,
      };

      // Add skills if using custom
      if (skillSource === 'custom') {
        payload.skills = customSkills.map((s) => ({
          name: s.name.trim(),
          level: s.level,
        }));
      }

      const response = await api.post('/roadmaps/generate', payload);

      // Navigate to roadmap detail view
      if (response.data.roadmap) {
        navigate(`/roadmaps/${response.data.roadmap._id}`);
      }
    } catch (err) {
      console.error('Roadmap generation error:', err);

      // Handle specific error types
      if (err.response?.data) {
        const errData = err.response.data;
        setError(errData.message || errData.error || 'Failed to generate roadmap');
      } else {
        setError('Failed to generate roadmap. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Roadmap</h1>
          <p className="text-lg text-gray-600">
            Build a personalized learning roadmap for your target role
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className="flex-1 mx-1">
                <div
                  className={`h-2 rounded-full transition-colors ${s <= step ? 'bg-indigo-600' : 'bg-gray-200'}`}
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {step} of {totalSteps}:{' '}
            {step === 1
              ? 'Select Skill Source'
              : step === 2
                ? 'Job Role & Daily Minutes'
                : 'Review & Generate'}
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onClose={() => setError('')} />
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Skill Source Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Skill Source</h2>

                {loadingProfile ? (
                  <div className="py-8 text-center">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <>
                    {/* Option 1: Use Profile Skills */}
                    <div
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        skillSource === 'profile'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                      onClick={() => setSkillSource('profile')}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <input
                            type="radio"
                            checked={skillSource === 'profile'}
                            onChange={() => setSkillSource('profile')}
                            className="w-5 h-5 text-indigo-600"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            📋 Use My Profile Skills
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Use skills stored in your profile for quick roadmap generation
                          </p>
                          {profileSkills.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700">
                                Your current skills:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {profileSkills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium"
                                  >
                                    {skill.name} • {skill.level}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                              No skills in profile yet.{' '}
                              <Link to="/profile" className="underline font-medium">
                                Add skills →
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Custom Skills */}
                    <div
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        skillSource === 'custom'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                      onClick={() => setSkillSource('custom')}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <input
                            type="radio"
                            checked={skillSource === 'custom'}
                            onChange={() => setSkillSource('custom')}
                            className="w-5 h-5 text-indigo-600"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            ✨ Enter Custom Skills
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Specify skills for this roadmap only (experimental)
                          </p>

                          {skillSource === 'custom' && (
                            <div className="space-y-3 mt-4">
                              {customSkills.map((skill, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <Input
                                    type="text"
                                    placeholder="Skill name (e.g., JavaScript)"
                                    value={skill.name}
                                    onChange={(e) => handleSkillChange(idx, 'name', e.target.value)}
                                    disabled={loading}
                                    list="common-skills"
                                    className="flex-1"
                                  />
                                  <Select
                                    value={skill.level}
                                    onChange={(e) =>
                                      handleSkillChange(idx, 'level', e.target.value)
                                    }
                                    options={SKILL_LEVELS}
                                    disabled={loading}
                                    className="w-40"
                                  />
                                  {customSkills.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSkill(idx)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                      disabled={loading}
                                    >
                                      <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
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
                              <datalist id="common-skills">
                                {COMMON_SKILLS.map((s) => (
                                  <option key={s} value={s} />
                                ))}
                              </datalist>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddSkill}
                                disabled={loading}
                                className="text-sm"
                              >
                                + Add Another Skill
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Job Role & Daily Minutes */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuration</h2>

                {/* Job Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Job Role <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={JOB_ROLES}
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    The system will create a learning path tailored to this role
                  </p>
                </div>

                {/* Daily Minutes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Learning Time:{' '}
                    <span className="font-bold text-indigo-600">{dailyMinutes} minutes/day</span>
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="480"
                    step="30"
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={loading}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>30 min</span>
                    <span>480 min (8h)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    {dailyMinutes <= 60
                      ? '🐢 Casual pace'
                      : dailyMinutes <= 120
                        ? '🚴 Moderate pace'
                        : dailyMinutes <= 240
                          ? '🚀 Intensive pace'
                          : '⚡ Maximum effort'}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Ready to Generate?</h2>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-4">
                  {/* Skill Source */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                    {skillSource === 'profile' ? (
                      <div>
                        <p className="text-sm text-gray-700 mb-2">Using profile skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {profileSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                            >
                              {skill.name} • {skill.level}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-700 mb-2">Using custom skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {customSkills
                            .filter((s) => s.name.trim())
                            .map((s, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                              >
                                {s.name} • {s.level}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Job Role & Minutes */}
                  <div className="border-t border-indigo-200 pt-3 space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Target Role:</span> 🎯 {roleName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Daily Learning:</span> ⏰ {dailyMinutes}{' '}
                      minutes/day
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>✨ What happens next:</strong> Our AI will analyze your skills,
                    determine the optimal learning path for {roleName}, create a week-by-week
                    schedule, and generate tasks with resources and exercises.
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
              {step < totalSteps ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  disabled={
                    loading ||
                    (step === 1 && skillSource === 'profile' && profileSkills.length === 0)
                  }
                >
                  Next →
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="min-w-[200px]"
                >
                  {loading && <LoadingSpinner className="inline mr-2" />}
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
