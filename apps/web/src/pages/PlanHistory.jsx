import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const PlanHistory = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans/my');
        setPlans(res.data.plans || []);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Card>
            <EmptyState
              title="No Plans Yet"
              description="Start creating your first learning plan to track your progress."
              action={
                <a href="/generate-plan">
                  <Button variant="primary">Create Your First Plan</Button>
                </a>
              }
            />
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan History</h1>
          <p className="text-gray-600">View all your created learning plans</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Plan {idx + 1}</h3>
                    {plan.status === 'active' && <Badge variant="success">Active</Badge>}
                    {plan.status === 'completed' && <Badge variant="default">Completed</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Created: {formatDate(plan.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600">Duration: {plan.weeks?.length || 0} weeks</p>
                </div>
              </div>

              {/* Topics */}
              {plan.topics && plan.topics.length > 0 && (
                <div className="mb-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.topics.slice(0, 3).map((topic, tidx) => (
                      <Badge key={tidx} variant="info">
                        {topic}
                      </Badge>
                    ))}
                    {plan.topics.length > 3 && (
                      <Badge variant="info">+{plan.topics.length - 3}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 pt-4 border-t border-gray-200">
                <div className="bg-indigo-50 rounded-lg p-3">
                  <p className="text-xs text-indigo-600 font-semibold">Total Tasks</p>
                  <p className="text-lg font-bold text-indigo-900">
                    {plan.weeks?.reduce((sum, w) => sum + (w.tasks?.length || 0), 0) || 0}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 font-semibold">Daily Minutes</p>
                  <p className="text-lg font-bold text-emerald-900">{plan.dailyMinutes}</p>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-gray-200">
                <a href={`/my-plan?plan=${plan._id}`}>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanHistory;
