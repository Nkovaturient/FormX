import { Link } from 'react-router-dom';
import { Brain, Shield, Zap, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="relative">
                <Brain className="h-8 w-8 text-primary-400" />
                <Zap className="h-4 w-4 text-accent-400 absolute -top-1 -right-1" />
              </div>
              <span className="text-xl font-bold">FormZen</span>
            </Link>

            <p className="text-gray-400 mb-6 leading-relaxed">
              AI-powered form automation that saves parents time and eliminates paperwork stress. 
              HIPAA, FERPA, and GDPR compliant.
            </p>

            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Shield className="h-4 w-4" />
              <span>Enterprise-grade security</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link to="/upload" className="text-gray-400 hover:text-white transition-colors">Form Upload</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/data-vault" className="text-gray-400 hover:text-white transition-colors">Data Vault</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mobile App</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Browser Extension</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Access</a></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Solutions</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">For Parents</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">For Schools</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">For Childcare</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">For Healthcare</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Enterprise</a></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3 mb-6">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status Page</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Support</a></li>
            </ul>

            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <a href="mailto:support@formfast.ai" className="hover:text-white transition-colors">
                  support@formfast.ai
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>1-800-FORMFAST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 FormFast. All rights reserved. Built with AI for parents everywhere.
            </div>
            
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">HIPAA Compliance</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="text-center text-xs text-gray-500">
              Powered by GROQ AI • LLAMA Models • Filecoin Storage • Snowflake Analytics
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;