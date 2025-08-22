import FormProcessing from '../components/FormProcessing';
import { 
  // Brain, 
  // Shield, 
  // Zap, 
  // CheckCircle,
  // Clock,
  // FileText,
  Camera,
  // Smartphone
} from 'lucide-react';

const UploadPage = () => {
  // const features = [
  //   {
  //     icon: Brain,
  //     title: 'AI-Powered OCR',
  //     description: 'Advanced machine learning models extract text, checkboxes, signatures, and tables with 95%+ accuracy',
  //     color: 'primary'
  //   },
  //   {
  //     icon: Zap,
  //     title: 'Lightning Fast',
  //     description: 'Process documents in under 3 seconds per page with real-time progress tracking',
  //     color: 'secondary'
  //   },
  //   {
  //     icon: Shield,
  //     title: 'Secure Processing',
  //     description: 'GDPR compliant with end-to-end encryption and automatic data integrity checks',
  //     color: 'accent'
  //   },
  //   {
  //     icon: Smartphone,
  //     title: 'Mobile Optimized',
  //     description: 'Responsive design works perfectly on all devices with touch-friendly controls',
  //     color: 'warning'
  //   }
  // ];

  // const capabilities = [
  //   { icon: FileText, label: 'Text Fields', accuracy: '99%' },
  //   { icon: CheckCircle, label: 'Checkboxes', accuracy: '97%' },
  //   { icon: Clock, label: 'Date Fields', accuracy: '98%' },
  //   { icon: FileText, label: 'Signatures', accuracy: '95%' },
  //   { icon: FileText, label: 'Tables', accuracy: '94%' },
  //   { icon: FileText, label: 'Radio Buttons', accuracy: '96%' }
  // ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full p-4">
              <Camera className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Advanced Document Processing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Upload any form or document and watch our AI extract, validate, and structure your data 
            with enterprise-grade accuracy and speed.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">95%+</div>
              <div className="text-gray-600">Field Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600">&lt;3s</div>
              <div className="text-gray-600">Processing Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-600">100%</div>
              <div className="text-gray-600">GDPR Compliant</div>
            </div>
          </div>
        </div>

        {/* Main Upload Component */}
        <FormProcessing />

        {/* Features Grid */}
        {/* <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Powerful Processing Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="feature-card text-center">
                  <div className={`bg-${feature.color}-100 rounded-full p-4 w-16 h-16 mx-auto mb-6`}>
                    <Icon className={`h-8 w-8 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div> */}

        {/* OCR Capabilities */}
        {/* <div className="mt-16 card p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            OCR Recognition Capabilities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">{capability.label}</div>
                  <div className="text-xs text-green-600 font-semibold">{capability.accuracy}</div>
                </div>
              );
            })}
          </div>
        </div> */}

        {/* Technical Specifications */}
        {/* <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Supported Formats</h3>
            <div className="space-y-3">
              {[
                { format: 'PDF', description: 'Fillable forms, scanned documents, multi-page files' },
                { format: 'JPEG/JPG', description: 'High-resolution photos, scanned images' },
                { format: 'PNG', description: 'Screenshots, digital forms, transparent backgrounds' },
                { format: 'TIFF', description: 'Professional scans, multi-page documents' }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">{item.format}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Processing Features</h3>
            <div className="space-y-3">
              {[
                'Automatic document rotation and skew correction',
                'Multi-page document handling with batch processing',
                'Field relationship detection and validation',
                'Confidence scoring for all extracted data',
                'Real-time error detection and retry mechanisms',
                'WCAG accessibility compliance throughout'
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        {/* Security & Compliance */}
       { /*<div className="mt-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white text-center">
          <Shield className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Security</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Your documents are processed with military-grade encryption and automatically deleted after processing. 
            Full GDPR, HIPAA, and FERPA compliance ensures your data stays private and secure.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-semibold">256-bit Encryption</div>
              <div className="text-sm opacity-75">End-to-end security</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-semibold">Auto-Delete</div>
              <div className="text-sm opacity-75">24-hour data retention</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-semibold">Compliance</div>
              <div className="text-sm opacity-75">GDPR, HIPAA, FERPA</div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default UploadPage;