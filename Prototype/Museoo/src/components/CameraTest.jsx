import React, { useState, useEffect } from 'react';

const CameraTest = () => {
  const [cameraStatus, setCameraStatus] = useState('Checking...');
  const [permissions, setPermissions] = useState({});
  const [browserInfo, setBrowserInfo] = useState({});
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results = [];
    
    // Check browser info
    const browser = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isSecure: window.location.protocol === 'https:',
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      isLocalNetwork: window.location.hostname.includes('192.168.') || 
                     window.location.hostname.includes('10.') || 
                     window.location.hostname.includes('172.')
    };
    
    setBrowserInfo(browser);
    results.push(`🌐 Protocol: ${browser.protocol}`);
    results.push(`🏠 Hostname: ${browser.hostname}`);
    results.push(`🔒 Secure: ${browser.isSecure ? '✅' : '❌'}`);
    results.push(`🏠 Localhost: ${browser.isLocalhost ? '✅' : '❌'}`);
    results.push(`🏠 Local Network: ${browser.isLocalNetwork ? '✅' : '❌'}`);

    // Check camera API support
    if (!navigator.mediaDevices) {
      results.push('❌ MediaDevices API not supported');
      setCameraStatus('Not Supported');
    } else if (!navigator.mediaDevices.getUserMedia) {
      results.push('❌ getUserMedia not supported');
      setCameraStatus('Not Supported');
    } else {
      results.push('✅ MediaDevices API supported');
      results.push('✅ getUserMedia supported');
      
      // Test camera permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        results.push('✅ Camera permission granted');
        results.push(`📹 Video tracks: ${stream.getVideoTracks().length}`);
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        setCameraStatus('Working');
        
      } catch (error) {
        results.push(`❌ Camera error: ${error.name} - ${error.message}`);
        setCameraStatus(`Error: ${error.name}`);
      }
    }

    // Check available cameras
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      results.push(`📹 Available cameras: ${videoDevices.length}`);
      
      videoDevices.forEach((device, index) => {
        results.push(`  ${index + 1}. ${device.label || 'Camera ' + (index + 1)}`);
      });
      
    } catch (error) {
      results.push(`❌ Cannot enumerate devices: ${error.message}`);
    }

    setTestResults(results);
  };

  const testCameraAccess = async () => {
    setCameraStatus('Testing...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setCameraStatus('✅ Camera access successful!');
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      setCameraStatus(`❌ Camera access failed: ${error.name} - ${error.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📱 Camera API Diagnostic Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">🔍 Browser Information</h2>
        <div className="space-y-1 text-sm">
          <div><strong>User Agent:</strong> {browserInfo.userAgent}</div>
          <div><strong>Platform:</strong> {browserInfo.platform}</div>
          <div><strong>Protocol:</strong> {browserInfo.protocol}</div>
          <div><strong>Hostname:</strong> {browserInfo.hostname}</div>
          <div><strong>Secure Connection:</strong> {browserInfo.isSecure ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Localhost:</strong> {browserInfo.isLocalhost ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Local Network:</strong> {browserInfo.isLocalNetwork ? '✅ Yes' : '❌ No'}</div>
        </div>
      </div>

      <div className="bg-blue-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">📹 Camera Status: {cameraStatus}</h2>
        <button 
          onClick={testCameraAccess}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Camera Access
        </button>
      </div>

      <div className="bg-white border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">📋 Diagnostic Results</h2>
        <div className="space-y-1 text-sm font-mono">
          {testResults.map((result, index) => (
            <div key={index}>{result}</div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
        <h3 className="font-semibold mb-2">💡 Solutions for Camera Issues:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>HTTPS Required:</strong> Mobile browsers require HTTPS for camera access</li>
          <li><strong>Localhost Exception:</strong> Camera works on localhost even with HTTP</li>
          <li><strong>Permission Denied:</strong> Check browser settings and allow camera access</li>
          <li><strong>Camera in Use:</strong> Close other apps using camera</li>
          <li><strong>Fallback:</strong> Use manual input when camera is not available</li>
        </ul>
      </div>
    </div>
  );
};

export default CameraTest;
