import { useState } from 'react';
import { 
  Check, 
  Zap, 
  Users, 
  Building,
  Crown,
  FileText,
  Clock
} from 'lucide-react';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: 'Personal',
      icon: Zap,
      price: billingCycle === 'monthly' ? 9 : 90,
      description: 'Perfect for busy parents',
      features: [
        'Up to 50 forms per month',
        'AI-powered form completion',
        'Secure data vault for family',
        'Mobile scanning app',
        'Email support',
        'HIPAA & FERPA compliance',
        'Basic form templates'
      ],
      cta: 'Start Free Trial',
      popular: false,
      color: 'primary'
    },
    {
      name: 'Family Pro',
      icon: Users,
      price: billingCycle === 'monthly' ? 19 : 190,
      description: 'For families with multiple children',
      features: [
        'Unlimited forms per month',
        'Advanced AI processing',
        'Multi-child management',
        'Priority processing',
        'Phone & chat support',
        'Advanced security features',
        'Custom form templates',
        'Direct school integration',
        'Family sharing & permissions'
      ],
      cta: 'Start Free Trial',
      popular: true,
      color: 'secondary'
    },
    {
      name: 'Enterprise',
      icon: Building,
      price: 'Custom',
      description: 'For schools and institutions',
      features: [
        'Unlimited forms & users',
        'Custom AI model training',
        'White-label solution',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced analytics',
        'SLA guarantees',
        'On-premise deployment option'
      ],
      cta: 'Contact Sales',
      popular: false,
      color: 'accent'
    }
  ];

  const partnerships = [
    {
      type: 'School Districts',
      description: 'Partner with FormFast to streamline enrollment processes',
      benefits: ['Reduced administrative burden', 'Faster form processing', 'Better data accuracy'],
      contact: 'schools@formfast.ai'
    },
    {
      type: 'Childcare Centers',
      description: 'Simplify intake and ongoing documentation',
      benefits: ['Automated form collection', 'Compliance assistance', 'Parent satisfaction'],
      contact: 'childcare@formfast.ai'
    },
    {
      type: 'Healthcare Providers',
      description: 'HIPAA-compliant form automation for pediatric practices',
      benefits: ['Secure data handling', 'Reduced wait times', 'Improved accuracy'],
      contact: 'healthcare@formfast.ai'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your family's needs. All plans include our core AI-powered form completion technology.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative card p-8 ${
                  plan.popular ? 'ring-2 ring-secondary-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-secondary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`bg-${plan.color}-100 rounded-full p-4 w-16 h-16 mx-auto mb-4`}>
                    <Icon className={`h-8 w-8 text-${plan.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    {typeof plan.price === 'number' ? (
                      <>
                        <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full ${
                    plan.popular
                      ? 'btn-primary'
                      : plan.name === 'Enterprise'
                      ? 'btn-secondary'
                      : 'btn-secondary'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="card p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Personal</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Family Pro</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { feature: 'Monthly Form Limit', personal: '50', family: 'Unlimited', enterprise: 'Unlimited' },
                  { feature: 'AI Processing Speed', personal: 'Standard', family: 'Priority', enterprise: 'Dedicated' },
                  { feature: 'Data Storage', personal: '1GB', family: '10GB', enterprise: 'Unlimited' },
                  { feature: 'Family Members', personal: '4', family: 'Unlimited', enterprise: 'Unlimited' },
                  { feature: 'Customer Support', personal: 'Email', family: 'Phone & Chat', enterprise: 'Dedicated Manager' },
                  { feature: 'API Access', personal: '✗', family: '✗', enterprise: '✓' },
                  { feature: 'Custom Integrations', personal: '✗', family: 'Limited', enterprise: 'Full' },
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                    <td className="py-4 px-6 text-center text-gray-700">{row.personal}</td>
                    <td className="py-4 px-6 text-center text-gray-700">{row.family}</td>
                    <td className="py-4 px-6 text-center text-gray-700">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Partnership Program */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Partnership Program</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our growing network of educational and healthcare institutions streamlining their form processes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partnerships.map((partnership, index) => (
              <div key={index} className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{partnership.type}</h3>
                <p className="text-gray-600 mb-4">{partnership.description}</p>
                <ul className="space-y-2 mb-6">
                  {partnership.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <a
                  href={`mailto:${partnership.contact}`}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Contact: {partnership.contact}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Success Metrics */}
        <div className="card p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Success Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary-600" />
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-2">98.5%</div>
              <div className="text-gray-600">Form Completion Accuracy</div>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Clock className="h-8 w-8 text-secondary-600" />
              </div>
              <div className="text-3xl font-bold text-secondary-600 mb-2">18min</div>
              <div className="text-gray-600">Average Time Saved</div>
            </div>
            <div className="text-center">
              <div className="bg-accent-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Users className="h-8 w-8 text-accent-600" />
              </div>
              <div className="text-3xl font-bold text-accent-600 mb-2">50,000+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Crown className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-2">4.9/5</div>
              <div className="text-gray-600">Customer Satisfaction</div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="card p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: 'How secure is my family\'s data?',
                a: 'We use military-grade 256-bit AES encryption and comply with HIPAA, FERPA, and GDPR standards. Your data is stored on Filecoin\'s decentralized network for maximum security.'
              },
              {
                q: 'What types of forms can FormFast handle?',
                a: 'FormFast works with all standard school forms, medical forms, camp registrations, sports team sign-ups, and most government documents.'
              },
              {
                q: 'Can I cancel my subscription anytime?',
                a: 'Yes, you can cancel your subscription at any time. Your data will remain accessible during your billing period.'
              },
              {
                q: 'How accurate is the AI form completion?',
                a: 'Our AI achieves 98%+ accuracy on most forms. For complex or unusual forms, you can review and edit before submission.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 30-day money-back guarantee for all new subscriptions. Try FormFast risk-free!'
              },
              {
                q: 'Can schools integrate with FormFast?',
                a: 'Yes! We offer API access and custom integrations for schools and institutions. Contact our enterprise team for details.'
              }
            ].map((faq, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PricingPage;