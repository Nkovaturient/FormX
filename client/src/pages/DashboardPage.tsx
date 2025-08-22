import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Download,
  Share2,
  TrendingUp,
  Shield,
  Zap,
  Loader
} from 'lucide-react';
import { formService, type FormProcessingResult } from '../api/index.js';

const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [processingHistory, setProcessingHistory] = useState<FormProcessingResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stats = {
    formsCompleted: processingHistory.filter(f => f.status === 'completed').length,
    timeSaved: processingHistory.filter(f => f.status === 'completed').length * 15, // 15 min per form
    averageAccuracy: 98.5,
    activeForms: processingHistory.filter(f => f.status === 'processing').length
  };

  useEffect(() => {
    const loadProcessingHistory = async () => {
      try {
        setIsLoading(true);
        const history = await formService.getProcessingHistory(20);
        setProcessingHistory(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setIsLoading(false);
      }
    };

    loadProcessingHistory();
  }, []);

  const recentForms = processingHistory.slice(0, 5).map(form => ({
    id: form.processingId,
    name: form.analysis?.formType || 'Unknown Form',
    type: form.analysis?.formType || 'General',
    status: form.status,
    completedAt: form.result?.downloadUrl ? new Date().toISOString() : undefined,
    accuracy: form.analysis?.confidence || 95,
    timeSaved: 15
  }));

  const upcomingDeadlines = [
    { form: 'PTA Volunteer Form', dueDate: '2024-01-22', days: 3 },
    { form: 'Field Trip Permission', dueDate: '2024-01-28', days: 9 },
    { form: 'Annual Health Update', dueDate: '2024-02-05', days: 17 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your form completion overview.</p>
            </div>
            <Link to="/upload" className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              New Form
            </Link>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}
          
          {/* Time Range Selector */}
          <div className="flex space-x-2">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-white text-gray-600 hover:text-primary-600'
                }`}
              >
                {range === '7d' ? 'Last 7 days' : 
                 range === '30d' ? 'Last 30 days' :
                 range === '90d' ? 'Last 90 days' : 'Last year'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-green-600 text-sm">Completed</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.formsCompleted}</div>
            <div className="text-gray-600 text-sm">Forms Completed</div>
            <div className="text-gray-500 text-xs mt-1">This period</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-blue-600 text-sm">Time Saved</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.timeSaved}h</div>
            <div className="text-gray-600 text-sm">Hours Saved</div>
            <div className="text-gray-500 text-xs mt-1">vs manual filling</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-purple-600 text-sm">Accuracy</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.averageAccuracy}%</div>
            <div className="text-gray-600 text-sm">Average Accuracy</div>
            <div className="text-gray-500 text-xs mt-1">AI-powered</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-yellow-600 text-sm">In Progress</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.activeForms}</div>
            <div className="text-gray-600 text-sm">Active Forms</div>
            <div className="text-gray-500 text-xs mt-1">Needs attention</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Forms */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Forms</h2>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View All
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-8 w-8 text-primary-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading forms...</span>
                </div>
              ) : recentForms.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No forms processed yet</p>
                  <Link to="/upload" className="btn-primary">
                    <Plus className="h-5 w-5 mr-2" />
                    Process Your First Form
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentForms.map((form) => (
                    <div key={form.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{form.name}</h3>
                          <p className="text-sm text-gray-600">{form.type}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          form.status === 'completed' ? 'bg-green-100 text-green-700' :
                          form.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {form?.status?.charAt(0).toUpperCase() + form?.status?.slice(1)}
                        </div>
                      </div>
                      
                      {form.status === 'completed' ? (
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            Completed {form.completedAt ? new Date(form.completedAt).toLocaleDateString() : 'Recently'}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-green-600">{form.accuracy}% accuracy</span>
                            <span className="text-primary-600">{form.timeSaved}min saved</span>
                          </div>
                        </div>
                      ) : form.status === 'processing' ? (
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center text-gray-600">
                            <Loader className="h-4 w-4 text-primary-500 mr-1 animate-spin" />
                            Processing...
                          </div>
                          <div className="flex items-center">
                            <span className="text-primary-600">In progress</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-sm">
                          <div className="text-gray-600">Status: {form.status}</div>
                          <div className="flex items-center">
                            <span className="text-gray-600">Ready</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2 mt-3">
                        <button className="flex items-center text-xs text-primary-600 hover:text-primary-700">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </button>
                        <button className="flex items-center text-xs text-primary-600 hover:text-primary-700">
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {upcomingDeadlines.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{item.form}</div>
                      <div className="text-xs text-gray-600">Due {item.dueDate}</div>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.days <= 7 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.days}d left
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/upload" className="flex items-center p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors group">
                  <div className="bg-primary-100 rounded-lg p-2 mr-3 group-hover:bg-primary-200">
                    <Plus className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="text-sm font-medium text-primary-700">Upload New Form</div>
                </Link>
                
                <Link to="/data-vault" className="flex items-center p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors group">
                  <div className="bg-secondary-100 rounded-lg p-2 mr-3 group-hover:bg-secondary-200">
                    <Shield className="h-4 w-4 text-secondary-600" />
                  </div>
                  <div className="text-sm font-medium text-secondary-700">Manage Data Vault</div>
                </Link>
                
                <button className="flex items-center p-3 bg-accent-50 rounded-lg hover:bg-accent-100 transition-colors group w-full">
                  <div className="bg-accent-100 rounded-lg p-2 mr-3 group-hover:bg-accent-200">
                    <Zap className="h-4 w-4 text-accent-600" />
                  </div>
                  <div className="text-sm font-medium text-accent-700">AI Form Assistant</div>
                </button>
              </div>
            </div>

            {/* Support */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-3 text-sm">
                <a href="#" className="block text-primary-600 hover:text-primary-700">📚 Form Completion Guide</a>
                <a href="#" className="block text-primary-600 hover:text-primary-700">💬 Live Chat Support</a>
                <a href="#" className="block text-primary-600 hover:text-primary-700">📧 Contact Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;