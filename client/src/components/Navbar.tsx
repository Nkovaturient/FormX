import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, Menu, X, Shield, Zap, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/upload', label: 'Upload' },
    { path: '/analyze', label: 'Analyze' },
    { path: '/data-vault', label: 'Data Vault' },
    { path: '/pricing', label: 'Pricing' },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold gradient-text">FormZen</span>
              </div>
              <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
            </div>
          </div>
        </nav>
        <div className="h-16" />
      </>
    );
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm' 
          : 'bg-white/95 backdrop-blur-lg border-b border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
              <div className="relative">
                <Brain className="h-8 w-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
                <Zap className="h-4 w-4 text-accent-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl font-bold gradient-text">FormFast</span>
              <Shield className="h-4 w-4 text-gray-400" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <div className="flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{user?.profile?.firstName || 'User'}</span>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="btn-primary text-sm px-4 py-2 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="text-gray-600 hover:text-primary-600 text-sm font-medium">
                    Sign In
                  </Link>
                  <Link to="/signup" className="btn-primary text-sm px-4 py-2">
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <div className={`lg:hidden fixed inset-0 top-16 z-40 transition-all duration-300 ${
          isMenuOpen 
            ? 'opacity-100 visible' 
            : 'opacity-0 invisible'
        }`}>
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              isMenuOpen ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Mobile Menu Panel */}
          <div className={`relative bg-white border-b border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-y-0' : '-translate-y-full'
          }`}>
            <div className="px-4 py-6 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-500'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Auth Section */}
              <div className="pt-6 border-t border-gray-200 mt-6">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user?.profile?.firstName} {user?.profile?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full btn-primary text-center flex items-center justify-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link 
                      to="/login" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 text-gray-600 hover:text-primary-600 font-medium"
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/signup" 
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full btn-primary text-center"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;