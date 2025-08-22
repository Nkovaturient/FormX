import FormAnalyzer from '../components/FormAnalyzer';

const FormAnalysisPage = () => {

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FormAnalyzer />

         {/* <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full p-4">
              <Brain className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Form Intelligence
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Analyze existing forms with GROQ AI, get data-driven recommendations, and generate 
            optimized forms using insights from thousands of successful templates.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">98%</div>
              <div className="text-gray-600">Analysis Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600">15s</div>
              <div className="text-gray-600">Analysis Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-600">10k+</div>
              <div className="text-gray-600">Forms Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">25%</div>
              <div className="text-gray-600">Avg Improvement</div>
            </div>
          </div>
        </div>  */}

        {/* API Integration Info */}
        {/* <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">GROQ AI Integration</h3>
            <div className="space-y-3">
              {[
                'Advanced reasoning models for form structure analysis',
                'Natural language processing for content optimization',
                'Pattern recognition from successful form templates',
                'Real-time performance prediction algorithms',
                'Automated accessibility and compliance checking',
                'Multi-language form analysis and recommendations'
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Tally API Generation</h3>
            <div className="space-y-3">
              {[
                'Automated form creation with optimized field layouts',
                'Smart validation rules based on field types',
                'Responsive design templates for all devices',
                'Integration with popular tools and services',
                'Custom branding and styling options',
                'Advanced logic and conditional field display'
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default FormAnalysisPage;