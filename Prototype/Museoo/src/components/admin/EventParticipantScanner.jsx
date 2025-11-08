import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScanType } from "html5-qrcode";
import api from "../../config/api";

const EventParticipantScanner = () => {
  const [scanned, setScanned] = useState("");
  const [participant, setParticipant] = useState(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [inputMode, setInputMode] = useState("qr");
  const [showManualInput, setShowManualInput] = useState(false);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Check if we're on HTTPS (required for camera access on mobile)
  const isSecure = window.location.protocol === 'https:' || 
                   window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';

  const checkCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
      setCameraError("");
      return true;
    } catch (err) {
      console.error("Camera permission error:", err);
      setCameraPermission(false);
      if (err.name === 'NotAllowedError') {
        setCameraError("Camera access denied. Please allow camera permissions and refresh the page.");
      } else if (err.name === 'NotFoundError') {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Camera access error: " + err.message);
      }
      return false;
    }
  };

  const startScanner = async () => {
    if (!scannerRef.current) {
      console.error("Scanner ref not available");
      setError("Scanner initialization failed");
      return;
    }
    
    try {
      setError("");
      setCameraError("");
      setIsScanning(true);
      
      console.log("Starting event participant scanner...");
      
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        setIsScanning(false);
        return;
      }

      if (!isSecure) {
        setCameraError("Camera access requires HTTPS connection.");
        setIsScanning(false);
        return;
      }
      
      html5QrCodeRef.current = new Html5Qrcode(scannerRef.current.id);
      
      const devices = await Html5Qrcode.getCameras();
      console.log("Available cameras:", devices);
      
      if (devices && devices.length === 0) {
        throw new Error("No cameras found on this device");
      }

      let cameraId = null;
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      
      if (backCamera) {
        cameraId = backCamera.id;
        console.log("Using back camera:", backCamera.label);
      } else if (devices.length > 0) {
        cameraId = devices[0].id;
        console.log("Using first available camera:", devices[0].label);
      }

      if (!cameraId) {
        throw new Error("No camera available");
      }
      
      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        async (decodedText) => {
          console.log("Event Participant QR Code detected:", decodedText);
          setScanned("QR Code scanned successfully! Processing...");
          
          if (html5QrCodeRef.current) {
            try {
              await html5QrCodeRef.current.stop();
              setIsScanning(false);
            } catch (stopError) {
              console.error("Error stopping scanner:", stopError);
              setIsScanning(false);
            }
          }
          
          await processEventQRCode(decodedText);
        },
        (err) => {
          if (!err.message.includes("NotFoundException") && !err.message.includes("No MultiFormat Readers")) {
            console.log("Scan error (continuing):", err);
          }
        }
      );
      
      setCameraPermission(true);
    } catch (err) {
      console.error("Scanner initialization error:", err);
      setError("Failed to initialize scanner: " + err.message);
      setIsScanning(false);
      setCameraPermission(false);
      
      if (err.message.includes("No cameras found")) {
        setCameraError("No camera detected. Please use manual input as backup.");
      } else if (err.message.includes("Permission")) {
        setCameraError("Camera permission denied. Please use manual input as backup.");
      } else {
        setCameraError("Camera initialization failed. Please use manual input as backup.");
      }
      
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (cleanupError) {
          console.log("Cleanup error (ignored):", cleanupError);
        }
      }
    }
  };

  const processEventQRCode = async (decodedText) => {
    try {
      console.log("🔍 Processing Event Participant QR Code:", decodedText);
      
      // Parse the QR code data (should be JSON with event_id, email, registration_id)
      const qrData = JSON.parse(decodedText);
      console.log("📋 Parsed QR data:", qrData);
      
      if (!qrData.event_id || !qrData.email || !qrData.registration_id) {
        throw new Error("Invalid QR code format. Missing required data.");
      }
      
      // Call the API to check in the participant
      const response = await api.post('/api/event-registrations/checkin', {
        registration_id: qrData.registration_id,
        event_id: qrData.event_id,
        email: qrData.email
      });
      
      console.log("📡 API Response:", response.data);
      
      if (response.data.success) {
        console.log("✅ Event Participant Check-in Success!");
        setParticipant(response.data.participant);
        setError("");
      } else {
        console.error("❌ Event Participant Check-in Failed:", response.data.error);
        setError(response.data.error || "Failed to check in participant");
      }
    } catch (err) {
      console.error("❌ Error processing event QR code:", err);
      if (err.name === 'SyntaxError') {
        setError("Invalid QR code format. Please scan a valid event participant QR code.");
      } else {
        setError(err.message || "Failed to process QR code");
      }
    }
  };

  const handleManualCheckin = async () => {
    if (!manualInput.trim()) {
      setError("Please enter a registration ID or participant ID");
      return;
    }
    
    try {
      setError("");
      setScanned("Processing manual check-in...");
      
      const response = await api.post('/api/event-registrations/checkin', {
        registration_id: manualInput.trim(),
        manual_checkin: true
      });
      
      if (response.data.success) {
        console.log("✅ Manual Check-in Success!");
        setParticipant(response.data.participant);
        setManualInput("");
        setShowManualInput(false);
      } else {
        setError(response.data.error || "Failed to check in participant");
      }
    } catch (err) {
      console.error("❌ Manual check-in error:", err);
      setError(err.response?.data?.error || "Failed to process manual check-in");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
        setIsScanning(false);
      }
    }
  };

  const resetScanner = () => {
    setScanned("");
    setParticipant(null);
    setError("");
    setManualInput("");
    setShowManualInput(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#8B6B21]/5 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#2e2b41] mb-2">
              <i className="fa-solid fa-qrcode mr-3"></i>
              Event Participant Scanner
            </h1>
            <p className="text-gray-600">Scan QR codes to check in event participants</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#2e2b41] mb-4">
              <i className="fa-solid fa-camera mr-2"></i>
              QR Code Scanner
            </h2>
            
            {!isScanning ? (
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-qrcode text-4xl text-gray-400"></i>
                </div>
                <button
                  onClick={startScanner}
                  className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <i className="fa-solid fa-play mr-2"></i>
                  Start Scanner
                </button>
              </div>
            ) : (
              <div>
                <div id="qr-reader" ref={scannerRef} className="w-full"></div>
                <button
                  onClick={stopScanner}
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  <i className="fa-solid fa-stop mr-2"></i>
                  Stop Scanner
                </button>
              </div>
            )}

            {cameraError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                {cameraError}
              </div>
            )}

            {/* Manual Input */}
            <div className="mt-6">
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-[#AB8841] hover:text-[#8B6B21] font-semibold"
              >
                <i className="fa-solid fa-keyboard mr-2"></i>
                Manual Check-in
              </button>
              
              {showManualInput && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter Registration ID or Participant ID"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  />
                  <button
                    onClick={handleManualCheckin}
                    className="mt-2 bg-[#AB8841] hover:bg-[#8B6B21] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <i className="fa-solid fa-check mr-2"></i>
                    Check In
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#2e2b41] mb-4">
              <i className="fa-solid fa-user-check mr-2"></i>
              Check-in Results
            </h2>
            
            {scanned && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
                <i className="fa-solid fa-info-circle mr-2"></i>
                {scanned}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                {error}
              </div>
            )}

            {participant && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <i className="fa-solid fa-check text-green-600 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-green-800">Check-in Successful!</h3>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-800">{participant.firstname} {participant.lastname}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-800">{participant.email}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Registration ID:</span>
                    <span className="ml-2 font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                      {participant.id}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Event:</span>
                    <span className="ml-2 text-gray-800">{participant.event_title}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Check-in Time:</span>
                    <span className="ml-2 text-gray-800">
                      {new Date(participant.checkin_time).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={resetScanner}
                  className="mt-4 w-full bg-[#AB8841] hover:bg-[#8B6B21] text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  <i className="fa-solid fa-redo mr-2"></i>
                  Scan Another
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventParticipantScanner;
