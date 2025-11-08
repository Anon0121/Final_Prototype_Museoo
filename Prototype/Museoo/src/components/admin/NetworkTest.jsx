import React, { useState } from 'react';
import api from '../../config/api';

const NetworkTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);

    const tests = [
      {
        name: 'API Base URL Check',
        test: () => Promise.resolve(api.defaults.baseURL || 'No base URL set')
      },
      {
        name: 'Backend Health Check',
        test: () => api.get('/api/health').then(res => `Status: ${res.status}`)
      },
      {
        name: 'Get Slots API',
        test: () => api.get('/api/slots?date=2024-12-25').then(res => `Slots: ${res.data.length}`)
      },
      {
        name: 'CORS Test',
        test: () => api.get('/api/cors-test').then(res => 'CORS Working')
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        setTestResults(prev => [...prev, { name: test.name, status: 'success', result }]);
      } catch (error) {
        setTestResults(prev => [...prev, { 
          name: test.name, 
          status: 'error', 
          result: error.message || error.toString() 
        }]);
      }
    }

    setTesting(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Network Connection Test</h2>
      <button 
        onClick={runTests} 
        disabled={testing}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: testing ? 'not-allowed' : 'pointer'
        }}
      >
        {testing ? 'Testing...' : 'Run Tests'}
      </button>

      <div style={{ marginTop: '20px' }}>
        <h3>Environment Info:</h3>
        <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>Protocol:</strong> {window.location.protocol}</p>
          <p><strong>Hostname:</strong> {window.location.hostname}</p>
          <p><strong>Backend URL:</strong> {api.defaults.baseURL || 'Not configured'}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Test Results:</h3>
        {testResults.map((test, index) => (
          <div 
            key={index}
            style={{ 
              padding: '10px', 
              marginBottom: '10px',
              borderRadius: '5px',
              backgroundColor: test.status === 'success' ? '#d4edda' : '#f8d7da',
              border: `1px solid ${test.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`
            }}
          >
            <strong>{test.name}:</strong> {test.result}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkTest;

