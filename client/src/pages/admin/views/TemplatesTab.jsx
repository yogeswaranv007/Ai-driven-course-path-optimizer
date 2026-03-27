import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import { adminService } from '../../../services/admin.service.js';

const TemplatesTab = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
    estimatedTotalDays: 30,
  });
  const [isCreating, setIsCreating] = useState(false);

  const fetchTemplates = async () => {
    try {
      const data = await adminService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCreating) return;
    try {
      setIsCreating(true);
      await adminService.createTemplate({ ...formData, basePhases: [] });
      setModalOpen(false);
      setFormData({ roleName: '', description: '', estimatedTotalDays: 30 });
      fetchTemplates();
    } catch (err) {
      alert('Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBroadcast = async (templateId, mode) => {
    if (
      window.confirm(
        `Are you sure you want to broadcast this template using ${mode} mode to ALL users?`
      )
    ) {
      try {
        const res = await adminService.broadcastRoadmap(templateId, mode);
        alert(res.message);
      } catch (err) {
        alert('Broadcast failed');
      }
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you absolutely sure you want to permanently delete this template?')) {
      try {
        await adminService.deleteTemplate(templateId);
        fetchTemplates();
      } catch (err) {
        alert('Failed to delete template');
      }
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Global Templates</h2>
          <p className="text-gray-500">
            Create core learning structures to broadcast via AI batching.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Create Template</Button>
      </div>

      {loading ? (
        <div className="text-center p-8">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card className="text-center p-12 text-gray-500">
          No templates found. Create one to start broadcasting.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card
              key={template._id}
              className="flex flex-col h-full hover:shadow-xl transition-shadow border-t-4 border-t-indigo-500"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-900">{template.roleName}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template._id)}
                    className="text-red-500 hover:bg-red-50 px-2 py-1 h-auto"
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2 mb-4 line-clamp-3">
                  {template.description || 'No description provided.'}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.targetFrameworks?.map((fw) => (
                    <span
                      key={fw}
                      className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full"
                    >
                      {fw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 mt-auto flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => handleBroadcast(template._id, 'generic')}
                >
                  Generic Broadcast (Fast)
                </Button>
                <Button
                  variant="primary"
                  className="w-full justify-center bg-gradient-to-r from-indigo-600 to-purple-600"
                  onClick={() => handleBroadcast(template._id, 'optimized')}
                >
                  AI Optimized Broadcast
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white animate-scale-up">
            <h3 className="text-xl font-bold mb-4">New Global Template</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Role Name (e.g. Frontend Dev)
                </label>
                <input
                  required
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 h-24"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Generating AI Template...' : 'Create Engine'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TemplatesTab;
