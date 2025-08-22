import { Link } from 'react-router-dom';
import { 
  Zap, 
  Shield, 
  Smartphone, 
  FileText, 
  Clock, 
  Users, 
  CheckCircle,
  Play,
  Star,
  TrendingUp,
  Brain,
  Database
} from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center animate-fade-in">
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Stop Filling Forms.
              <br />
              <span className="text-yellow-300">Start Living.</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-90 leading-relaxed">
              FormFast's AI automatically completes school forms, childcare documents, and paperwork in seconds. 
              Save 15+ minutes per form with 98%+ accuracy.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link to="/upload" className="btn-primary text-lg px-8 py-4 bg-white text-yellow-400 hover:bg-gray-100">
                <Zap className="h-5 w-5 mr-2" />
                Try It Free - Upload Form
              </Link>
              <button className="flex items-center text-white hover:text-yellow-300 transition-colors text-lg">
                <Play className="h-5 w-5 mr-2" />
                Watch Demo (2 min)
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-300 mb-2">98%+</div>
                <div className="text-white/80">Form Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-300 mb-2">15min</div>
                <div className="text-white/80">Average Time Saved</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-300 mb-2">50k+</div>
                <div className="text-white/80">Forms Processed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">The Parent's Paperwork Nightmare</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Parents spend hours every week filling out repetitive forms for schools, daycares, camps, and activities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-100">
              <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                <Clock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Time Consuming</h3>
              <p className="text-gray-600">Average parent spends 3+ hours weekly on forms and paperwork</p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-yellow-100">
              <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Repetitive Data</h3>
              <p className="text-gray-600">Same information requested over and over across different forms</p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-orange-100">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Stressful Process</h3>
              <p className="text-gray-600">Deadlines, missing documents, and formatting errors cause anxiety</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">How FormFast Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to never manually fill a form again
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card text-center group">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-full p-6 w-20 h-20 mx-auto mb-8 group-hover:scale-110 transition-transform">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">1. Scan or Upload</h3>
              <p className="text-gray-600 mb-6">
                Use your phone to scan any form or upload PDFs. Our AI instantly recognizes form fields and requirements.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="text-sm text-gray-500 mb-2">Supported formats:</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">PDF</span>
                  <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">JPG</span>
                  <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">PNG</span>
                  <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">Scanned</span>
                </div>
              </div>
            </div>
            
            <div className="feature-card text-center group">
              <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full p-6 w-20 h-20 mx-auto mb-8 group-hover:scale-110 transition-transform">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">2. AI Processing</h3>
              <p className="text-gray-600 mb-6">
                GROQ and LLAMA models analyze the form, understand context, and pull appropriate data from your secure vault.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="text-sm text-gray-500 mb-2">AI capabilities:</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Context understanding
                  </div>
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Smart field mapping
                  </div>
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Data validation
                  </div>
                </div>
              </div>
            </div>
            
            <div className="feature-card text-center group">
              <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-full p-6 w-20 h-20 mx-auto mb-8 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">3. Auto-Complete</h3>
              <p className="text-gray-600 mb-6">
                Form is instantly filled with 98%+ accuracy. Review, edit if needed, and submit directly to institutions.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="text-sm text-gray-500 mb-2">Completion time:</div>
                <div className="text-2xl font-bold text-green-600 mb-1"> 30 seconds</div>
                <div className="text-xs text-gray-500">vs 15-30 minutes manually</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Enterprise-Grade Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for parents, trusted by institutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card">
              <Shield className="h-12 w-12 text-primary-600 mb-6" />
              <h3 className="text-xl font-semibold mb-4">HIPAA & FERPA Compliant</h3>
              <p className="text-gray-600">Military-grade encryption with compliance for health and education data protection.</p>
            </div>
            
            <div className="feature-card">
              <Database className="h-12 w-12 text-secondary-600 mb-6" />
              <h3 className="text-xl font-semibold mb-4">Secure Data Vault</h3>
              <p className="text-gray-600">Store family information once, use everywhere. Powered by Filecoin for decentralized security.</p>
            </div>
            
            <div className="feature-card">
              <Smartphone className="h-12 w-12 text-accent-600 mb-6" />
              <h3 className="text-xl font-semibold mb-4">Mobile Scanning</h3>
              <p className="text-gray-600">Real-time form detection and processing directly from your smartphone camera.</p>
            </div>
            
            <div className="feature-card">
              <TrendingUp className="h-12 w-12 text-primary-600 mb-6" />
              <h3 className="text-xl font-semibold mb-4">Smart Analytics</h3>
              <p className="text-gray-600">Track time saved, form completion rates, and manage deadlines with intelligent reminders.</p>
            </div>
            
            <div className="feature-card">
              <Users className="h-12 w-12 text-secondary-600 mb-6" />
              <h3 className="text-xl font-semibold mb-4">Family Sharing</h3>
              <p className="text-gray-600">Securely share access with partners and manage multiple children's forms in one place.</p>
            </div>
            
            <div className="feature-card">
              <CheckCircle className="h-12 w-12 text-accent-600 mb-6" />
              <h3 className="text-xl font-semibold mb-4">Institution Integration</h3>
              <p className="text-gray-600">Direct submission to schools and childcare providers with delivery confirmations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Loved by Parents Everywhere</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 border border-primary-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">"FormFast saved me 8 hours last week alone. The AI is incredibly accurate and my kids' school forms are always perfect."</p>
              <div className="flex items-center">
                <div className="bg-primary-200 rounded-full w-12 h-12 flex items-center justify-center text-primary-700 font-semibold">
                  SM
                </div>
                <div className="ml-4">
                  <div className="font-semibold">Sarah Martinez</div>
                  <div className="text-gray-500 text-sm">Mother of 3, Phoenix</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-secondary-50 to-accent-50 rounded-2xl p-8 border border-secondary-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">"The security features give me peace of mind. HIPAA compliance was crucial for our family's medical forms."</p>
              <div className="flex items-center">
                <div className="bg-secondary-200 rounded-full w-12 h-12 flex items-center justify-center text-secondary-700 font-semibold">
                  DK
                </div>
                <div className="ml-4">
                  <div className="font-semibold">David Kim</div>
                  <div className="text-gray-500 text-sm">Father of 2, Seattle</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl p-8 border border-accent-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">"Game changer for busy parents. The mobile app makes it so easy to handle forms on the go."</p>
              <div className="flex items-center">
                <div className="bg-accent-200 rounded-full w-12 h-12 flex items-center justify-center text-accent-700 font-semibold">
                  LW
                </div>
                <div className="ml-4">
                  <div className="font-semibold">Lisa Williams</div>
                  <div className="text-gray-500 text-sm">Mother of 1, Austin</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;