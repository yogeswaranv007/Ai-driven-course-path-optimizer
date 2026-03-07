import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hero Section */}
      <section className="flex-1 py-16 md:py-24 px-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Your Personalized Learning Path
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get a custom 4-week learning plan based on your skills, marks, and available time.
              Smart recommendations. Clear progress tracking. Real results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="primary" size="lg">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            {/* Feature 1 */}
            <Card>
              <div className="mb-4 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Plans</h3>
              <p className="text-sm text-gray-600">
                AI-driven recommendations tailored to your current skill level, marks, and learning
                goals.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card>
              <div className="mb-4 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Visual Progress</h3>
              <p className="text-sm text-gray-600">
                Track your skill gaps with beautiful charts and watch your improvement over time.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card>
              <div className="mb-4 w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-sky-600"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Tracking</h3>
              <p className="text-sm text-gray-600">
                Mark tasks complete, review your progress, and get gentle nudges to stay on track.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 md:px-6">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-600">
          <p>&copy; 2026 Learning Path Optimizer. Built with ❤️ for learners.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
