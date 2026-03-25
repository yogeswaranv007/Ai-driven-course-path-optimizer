import React, { useState } from 'react';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import { adminService } from '../../../services/admin.service.js';

const UsersTab = ({ users, refresh }) => {
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: '', data: null }); // type: 'add', 'edit', 'generate'
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user', password: '' });

  const openModal = (type, data = null) => {
    setModal({ isOpen: true, type, data });
    if (type === 'edit') {
      setFormData({ name: data.name, email: data.email, role: data.role, password: '' });
    } else {
      setFormData({ name: '', email: '', role: 'user', password: '' });
    }
  };

  const closeModal = () => setModal({ isOpen: false, type: '', data: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (modal.type === 'add') {
        await adminService.createUser(formData);
      } else if (modal.type === 'edit') {
        await adminService.updateUser(modal.data._id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
      }
      closeModal();
      refresh();
    } catch (error) {
      alert(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (
      window.confirm(
        `Are you absolutely sure you want to permanently delete ${user.name} and ALL their roadmaps?`
      )
    ) {
      try {
        setLoading(true);
        await adminService.deleteUser(user._id);
        refresh();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="animate-fade-in-up">
      <Card className="w-full overflow-hidden p-0 mb-10 !border-0 shadow-lg">
        <div className="p-6 border-b border-gray-100 bg-white/50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">User Directory</h3>
            <p className="text-sm text-gray-500">
              Manage access, update details, and oversee roadmaps.
            </p>
          </div>
          <Button onClick={() => openModal('add')}>+ Add User</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm font-medium border-b border-gray-100">
                <th className="p-4 px-6">Name</th>
                <th className="p-4 px-6">Email</th>
                <th className="p-4 px-6">Role</th>
                <th className="p-4 px-6 text-center">Data</th>
                <th className="p-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="p-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                      {user.name.substring(0, 2)}
                    </div>
                    {user.name}
                  </td>
                  <td className="p-4 px-6 text-gray-600 text-sm">{user.email}</td>
                  <td className="p-4 px-6">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 px-6 text-center text-gray-700 font-medium">
                    {user.roadmapCount || 0} Paths
                  </td>
                  <td className="p-4 px-6 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal('edit', user)}
                      className="shadow-none scale-90"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user)}
                      disabled={loading}
                      className="shadow-none scale-90"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Basic Modal Implementation */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white animate-scale-up">
            <h3 className="text-xl font-bold mb-4">
              {modal.type === 'add' ? 'Create New User' : `Edit ${modal.data?.name}`}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {modal.type === 'add' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    required
                    minLength="6"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              )}
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" type="button" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save User'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UsersTab;
