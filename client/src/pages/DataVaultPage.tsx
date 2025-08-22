import { useState } from 'react';
import { 
  Shield, 
  User, 
  Users,
  Phone, 
  Calendar,
  Heart,
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const DataVaultPage = () => {
  const [activeSection, setActiveSection] = useState('personal');
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const vaultSections = [
    { id: 'personal', label: 'Personal Info', icon: User, color: 'primary' },
    { id: 'family', label: 'Family Members', icon: Users, color: 'secondary' },
    { id: 'contact', label: 'Contact Details', icon: Phone, color: 'accent' },
    { id: 'medical', label: 'Medical Info', icon: Heart, color: 'error' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'warning' },
  ];

  const personalData = [
    { label: 'Full Name', value: 'Michael Johnson', type: 'text', sensitive: false },
    { label: 'Date of Birth', value: '1985-03-15', type: 'date', sensitive: false },
    { label: 'Social Security Number', value: '***-**-4567', type: 'ssn', sensitive: true },
    { label: 'Driver\'s License', value: 'DL****8901', type: 'text', sensitive: true },
    { label: 'Occupation', value: 'Software Engineer', type: 'text', sensitive: false },
  ];

  const familyData = [
    {
      id: 1,
      name: 'Emma Johnson',
      relationship: 'Daughter',
      dob: '2018-03-15',
      school: 'Lincoln Elementary',
      grade: 'Kindergarten'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      relationship: 'Spouse',
      dob: '1987-08-22',
      occupation: 'Nurse',
      workplace: 'Springfield Hospital'
    }
  ];

  const contactData = [
    { label: 'Home Address', value: '123 Main Street, Springfield, IL 62701', type: 'address', sensitive: false },
    { label: 'Primary Phone', value: '(555) 123-4567', type: 'phone', sensitive: false },
    { label: 'Work Phone', value: '(555) 987-6543', type: 'phone', sensitive: false },
    { label: 'Email Address', value: 'michael.johnson@email.com', type: 'email', sensitive: false },
    { label: 'Emergency Contact', value: 'John Johnson - (555) 555-0123', type: 'text', sensitive: false },
  ];

  const medicalData = [
    { label: 'Blood Type', value: showSensitiveData ? 'A+' : '***', type: 'text', sensitive: true },
    { label: 'Allergies', value: 'No known allergies', type: 'text', sensitive: false },
    { label: 'Current Medications', value: showSensitiveData ? 'None' : '***', type: 'text', sensitive: true },
    { label: 'Insurance Provider', value: showSensitiveData ? 'Blue Cross Blue Shield' : '***', type: 'text', sensitive: true },
    { label: 'Policy Number', value: showSensitiveData ? 'BC123456789' : '***********', type: 'text', sensitive: true },
  ];

  const renderDataSection = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div className="space-y-4">
            {personalData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-200 transition-colors">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">{item.label}</label>
                  <div className="mt-1 text-gray-900">
                    {item.sensitive && !showSensitiveData ? item.value : item.value.replace(/\*/g, '•')}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.sensitive && (
                    <Lock className="h-4 w-4 text-yellow-500" />
                  )}
                  <button className="text-primary-600 hover:text-primary-700">
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'family':
        return (
          <div className="space-y-4">
            {familyData.map((member) => (
              <div key={member.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-gray-600">{member.relationship}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-primary-600 hover:text-primary-700">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Date of Birth:</span>
                    <div className="font-medium">{member.dob}</div>
                  </div>
                  {member.school && (
                    <div>
                      <span className="text-gray-500">School:</span>
                      <div className="font-medium">{member.school}</div>
                    </div>
                  )}
                  {member.grade && (
                    <div>
                      <span className="text-gray-500">Grade:</span>
                      <div className="font-medium">{member.grade}</div>
                    </div>
                  )}
                  {member.occupation && (
                    <div>
                      <span className="text-gray-500">Occupation:</span>
                      <div className="font-medium">{member.occupation}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors">
              <Plus className="h-6 w-6 mx-auto mb-2" />
              Add Family Member
            </button>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            {contactData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-200 transition-colors">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">{item.label}</label>
                  <div className="mt-1 text-gray-900">{item.value}</div>
                </div>
                <button className="text-primary-600 hover:text-primary-700">
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        );

      case 'medical':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-yellow-800">HIPAA Protected Information</h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    This section contains sensitive medical information that is encrypted and protected under HIPAA compliance.
                  </p>
                </div>
              </div>
            </div>
            {medicalData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-200 transition-colors">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">{item.label}</label>
                  <div className="mt-1 text-gray-900">{item.value}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.sensitive && (
                    <Lock className="h-4 w-4 text-red-500" />
                  )}
                  <button className="text-primary-600 hover:text-primary-700">
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900">Data Categories</h3>
                <button
                  onClick={() => setShowSensitiveData(!showSensitiveData)}
                  className={`p-2 rounded-lg transition-colors ${
                    showSensitiveData 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={showSensitiveData ? 'Hide sensitive data' : 'Show sensitive data'}
                >
                  {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <nav className="space-y-2">
                {vaultSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="w-full btn-primary text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Data
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {vaultSections.find(s => s.id === activeSection)?.label}
                </h2>
                <div className="flex space-x-2">
                  <button className="btn-secondary text-sm">
                    Export Data
                  </button>
                  <button className="btn-primary text-sm">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Section
                  </button>
                </div>
              </div>

              {renderDataSection()}
            </div>

            {/* Data Usage Stats */}
            <div className="card p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Usage & Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-3">
                    <Shield className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">256-bit</div>
                  <div className="text-gray-600 text-sm">AES Encryption</div>
                </div>
                <div className="text-center">
                  <div className="bg-secondary-100 rounded-full p-4 w-16 h-16 mx-auto mb-3">
                    <Calendar className="h-8 w-8 text-secondary-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">47</div>
                  <div className="text-gray-600 text-sm">Forms Auto-Filled</div>
                </div>
                <div className="text-center">
                  <div className="bg-accent-100 rounded-full p-4 w-16 h-16 mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-accent-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">99.2%</div>
                  <div className="text-gray-600 text-sm">Data Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVaultPage;