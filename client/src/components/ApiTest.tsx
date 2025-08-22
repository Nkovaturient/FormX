import React, { useState } from 'react';
import { apiClient } from '../api/index.js';

const ApiTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testApiConnection = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      addResult('Starting API connection test...');
      
      // Test 1: Health check
      addResult('Testing health endpoint...');
      const healthResponse = await fetch('http://localhost:3001/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        addResult(`✅ Health check passed: ${healthData.status}`);
      } else {
        addResult(`❌ Health check failed: ${healthResponse.status}`);
      }

      // Test 2: API client configuration
      addResult('Testing API client configuration...');
      addResult(`API Base URL: ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}`);
      
      // Test 3: Authentication check
      addResult('Testing authentication...');
      const token = localStorage.getItem('authToken');
      if (token) {
        addResult(`✅ Auth token found: ${token.substring(0, 20)}...`);
      } else {
        addResult('⚠️ No auth token found - some endpoints may fail');
      }

      // Test 4: Form templates endpoint (should work without auth)
      addResult('Testing form templates endpoint...');
      try {
        const templatesResponse = await apiClient.getFormTemplates();
        addResult(`✅ Templates endpoint: ${templatesResponse.success ? 'Success' : 'Failed'}`);
      } catch (error) {
        addResult(`❌ Templates endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      addResult('API connection test completed!');
      
    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testFormAnalysis = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      addResult('Testing form analysis endpoint...');
      
      // Create a mock file for testing
      const mockFile = new File(['Mock form content'], 'test-form.pdf', { type: 'application/pdf' });
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        addResult('❌ No auth token - cannot test protected endpoints');
        return;
      }

      addResult('Sending form analysis request...');
      const response = await apiClient.analyzeForm([mockFile], {
        purpose: 'Test Analysis',
        industry: 'Test',
        targetAudience: 'Test Users'
      });

      addResult(`✅ Form analysis response: ${response.success ? 'Success' : 'Failed'}`);
      if (response.success) {
        addResult(`Analysis ID: ${response.data.analysisId}`);
        addResult(`Files processed: ${response.data.summary.filesProcessed}`);
      } else {
        addResult(`Error: ${response.message}`);
      }
      
    } catch (error) {
      addResult(`❌ Form analysis test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">API Communication Test</h2>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={testApiConnection}
            disabled={isTesting}
            className="btn-primary"
          >
            {isTesting ? 'Testing...' : 'Test API Connection'}
          </button>
          
          <button
            onClick={testFormAnalysis}
            disabled={isTesting}
            className="btn-secondary"
          >
            {isTesting ? 'Testing...' : 'Test Form Analysis'}
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click a test button above.</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Expected Flow:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Frontend sends HTTP request to backend API endpoint</li>
            <li>2. Backend receives request and validates authentication</li>
            <li>3. Backend processes request through FormAnalysisService</li>
            <li>4. FormAnalysisService calls the appropriate agents from client/dist/agents/</li>
            <li>5. Agents process the request and return results</li>
            <li>6. Backend sends response back to frontend</li>
            <li>7. Frontend displays results to user</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ApiTest; 