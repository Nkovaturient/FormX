import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import FormAnalysisPage from './pages/FormAnalysisPage';
import DataVaultPage from './pages/DataVaultPage';
import PricingPage from './pages/PricingPage';
import Footer from './components/Footer';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            
            {/* Auth Routes (redirect to dashboard if already authenticated) */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <SignupPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes (require authentication) */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analyze" 
              element={
                <ProtectedRoute>
                  <FormAnalysisPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/data-vault" 
              element={
                <ProtectedRoute>
                  <DataVaultPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Footer />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;