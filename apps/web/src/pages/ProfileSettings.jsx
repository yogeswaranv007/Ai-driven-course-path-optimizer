import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import Badge from '../components/ui/Badge.jsx';

const SKILL_LEVELS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const COMMON_SKILLS = [
  'JavaScript',
  'Python',
  'React',
  'Node.js',
  'TypeScript',
  'Java',
  'HTML',
  'CSS',
  'MongoDB',
  'SQL',
  'Git',
  'Docker',
  'AWS',
  'REST APIs',
  'GraphQL',
];

const ProfileSettings = () => {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'beginner' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setSkills(res.data.user.skills || []);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();

    if (!newSkill.name.trim()) {
      setError('Please enter a skill name');
      return;
    }

    // Check for duplicates
    if (skills.some((s) => s.name.toLowerCase() === newSkill.name.toLowerCase())) {
      setError('This skill already exists');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/profile/skills', {
        name: newSkill.name.trim(),
        level: newSkill.level,
      });

      // Refresh profile
      await fetchProfile();
      setNewSkill({ name: '', level: 'beginner' });
      setSuccess('Skill added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to add skill:', error);
      setError(error.response?.data?.message || 'Failed to add skill');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (skillName) => {
    if (!window.confirm(`Remove "${skillName}" from your skills?`)) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/profile/skills/${encodeURIComponent(skillName)}`);

      // Refresh profile
      await fetchProfile();
      setSuccess('Skill removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to remove skill:', error);
      setError(error.response?.data?.message || 'Failed to remove skill');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSkillLevel = async (skillName, newLevel) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update by removing and adding back with new level
      const updatedSkills = skills.map((s) =>
        s.name === skillName ? { ...s, level: newLevel } : s
      );

      await api.put('/profile/skills', { skills: updatedSkills });

      // Refresh profile
      await fetchProfile();
      setSuccess('Skill level updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to update skill:', error);
      setError(error.response?.data?.message || 'Failed to update skill');
    } finally {
      setSaving(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-blue-100 text-blue-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your skills to get better roadmap recommendations</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onClose={() => setError('')} />
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* User Info Card */}
        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Name</span>
              <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="text-sm text-gray-600">Total Skills</span>
              <Badge variant="primary">{skills.length}</Badge>
            </div>
          </div>
        </Card>

        {/* Add New Skill Card */}
        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Skill</h2>
          <form onSubmit={handleAddSkill} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skill Name</label>
                <Input
                  type="text"
                  placeholder="e.g., JavaScript, Python, React"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  list="common-skills"
                />
                <datalist id="common-skills">
                  {COMMON_SKILLS.map((skill) => (
                    <option key={skill} value={skill} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proficiency Level
                </label>
                <Select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                  options={SKILL_LEVELS}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Skill'}
            </Button>
          </form>
        </Card>

        {/* Current Skills Card */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Skills ({skills.length})
          </h2>

          {skills.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-600 mb-2">No skills added yet</p>
              <p className="text-sm text-gray-500">Add your first skill above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(skill.level)}`}
                    >
                      {skill.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={skill.level}
                      onChange={(e) => handleUpdateSkillLevel(skill.name, e.target.value)}
                      options={SKILL_LEVELS}
                      disabled={saving}
                      className="text-sm"
                    />
                    <button
                      onClick={() => handleRemoveSkill(skill.name)}
                      disabled={saving}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove skill"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mr-3 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">About Skills</h3>
              <p className="text-sm text-blue-800">
                Your skills will be used when generating roadmaps with "Use Profile Skills" option.
                Keep them updated to get the most relevant learning paths!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
