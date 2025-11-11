import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScanType } from "html5-qrcode";
import api, { API_BASE_URL } from "../../config/api";

const VisitorScanner = () => {
  const [scanned, setScanned] = useState("")
  const [visitor, setVisitor] = useState(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [inputMode, setInputMode] = useState("qr");
  const [showManualInput, setShowManualInput] = useState(false); // "qr" or "backup"
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInType, setCheckInType] = useState('visitor'); // 'visitor', 'event'
  const [incompleteFormError, setIncompleteFormError] = useState(null); // Track incomplete form errors
  const [visitorsCheckedIn, setVisitorsCheckedIn] = useState([]);
  const INCOMPLETE_INFO_MESSAGE = "Visitor should finish their information before checking in.";

  const valueLooksMissing = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value !== 'string') return value === '';
    const normalized = value.trim().toLowerCase();
    return (
      normalized === '' ||
      normalized === 'not provided' ||
      normalized === 'not specified' ||
      normalized === 'n/a' ||
      normalized === 'na' ||
      normalized === 'none' ||
      normalized === 'unknown' ||
      normalized === 'null' ||
      normalized === 'undefined'
    );
  };

  const getVisitorField = (visitor, candidates) => {
    if (!visitor) return '';
    for (const key of candidates) {
      if (visitor[key] !== undefined && visitor[key] !== null) {
        return visitor[key];
      }
    }
    return '';
  };

  const isVisitorInfoIncomplete = (visitor) => {
    if (!visitor) return true;
    const firstName = getVisitorField(visitor, ['firstName', 'first_name', 'firstname']);
    const lastName = getVisitorField(visitor, ['lastName', 'last_name', 'lastname']);
    const gender = getVisitorField(visitor, ['gender']);
    return valueLooksMissing(firstName) || valueLooksMissing(lastName) || valueLooksMissing(gender);
  };


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
      
      // Request camera permission with more specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Stop the stream immediately after permission check
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
      } else if (err.name === 'NotSupportedError') {
        setCameraError("Camera not supported on this device.");
      } else if (err.name === 'NotReadableError') {
        setCameraError("Camera is already in use by another application.");
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
      
      console.log("Starting scanner...");
      console.log("Scanner ref ID:", scannerRef.current.id);
      
      // Check camera permission first
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        setIsScanning(false);
        return;
      }

      // Check if we're on a secure connection
      if (!isSecure) {
        setCameraError("Camera access requires HTTPS connection.");
        setIsScanning(false);
        return;
      }
      
      console.log("Creating Html5Qrcode instance...");
      html5QrCodeRef.current = new Html5Qrcode(scannerRef.current.id);
      
      // Get available cameras
      console.log("Getting available cameras...");
      const devices = await Html5Qrcode.getCameras();
      console.log("Available cameras:", devices);
      
      if (devices && devices.length === 0) {
        throw new Error("No cameras found on this device");
      }

      // Try to use back camera first, then any available camera
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
          console.log("QR Code detected:", decodedText);
          setScanned("QR Code scanned successfully! Processing...");
          
          // Stop scanning after successful scan
          if (html5QrCodeRef.current) {
            try {
              await html5QrCodeRef.current.stop();
              setIsScanning(false);
            } catch (stopError) {
              console.error("Error stopping scanner:", stopError);
              setIsScanning(false);
            }
          }
          
          // Process the QR code
          await processQRCode(decodedText);
        },
        (err) => {
          // Only log non-transient errors to reduce noise
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
      
      // Show helpful message for common issues
      if (err.message.includes("No cameras found")) {
        setCameraError("No camera detected. Please use manual input as backup.");
      } else if (err.message.includes("Permission")) {
        setCameraError("Camera permission denied. Please use manual input as backup.");
      } else if (err.message.includes("load failed") || err.message.includes("NotAllowedError")) {
        setCameraError("Camera access failed. Please check browser permissions and try manual input.");
        setShowManualInput(true);
      } else {
        setCameraError("Camera initialization failed. Please use manual input as backup.");
        setShowManualInput(true);
      }
      
      // Clean up any partial initialization
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (cleanupError) {
          console.log("Cleanup error (ignored):", cleanupError);
        }
      }
    }
  };

  const processQRCode = async (decodedText) => {
    try {
      setIncompleteFormError(null); // Clear incomplete form error when processing new QR code
      // Check if it's a URL (primary visitor) or JSON (group member/event participant)
      if (decodedText.includes("/api/visit/checkin/")) {
        const res = await fetch(decodedText);
        const json = await res.json();

        if (json.success) {
          setVisitor(json.visitor);
          setError("");
          setIncompleteFormError(null);
        } else {
          // Handle specific error cases
          if (json.status === 'cancelled') {
            setError("This booking has been cancelled and cannot be checked in.");
          } else if (json.status === 'checked-in') {
            setError("This visitor has already visited.");
          } else if (json.status === 'incomplete' || json.status === 'form-incomplete') {
            // Handle incomplete form error from QR code scan
            setIncompleteFormError({
              message: INCOMPLETE_INFO_MESSAGE,
              missingFields: json.missingFields || [],
              email: json.email
            });
            setScanned("");
            setError("");
          } else {
            setError(json.error || "Visit failed");
          }
        }
      } else {
        // Try to parse as JSON for other visitor types
        try {
          const qrData = JSON.parse(decodedText);
          console.log("📋 Parsed QR data:", qrData);
          
          // Check for event participant QR code first
          if (qrData.type === 'event_participant') {
            console.log("🎯 Detected: Event Participant QR Code");
            console.log("🔍 Event Participant QR Data:", qrData);
            
            // Call the event participant check-in API
            const apiUrl = `${API_BASE_URL}/api/event-registrations/checkin`;
            console.log("🌐 Sending request to:", apiUrl);
            
            // Prepare request body - handle both old and new QR code formats
            const requestBody = {
              registration_id: qrData.registration_id,
              event_id: qrData.event_id
            };
            
            // Add email if available (new QR code format)
            if (qrData.email) {
              requestBody.email = qrData.email;
            }
            
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            });
            
            console.log("📡 API Response Status:", res.status);
            const json = await res.json();
            console.log("📋 API Response Data:", json);
            
            if (json.success) {
              console.log("✅ Event Participant Check-in Success!");
              setVisitor({
                ...json.participant,
                visitorType: 'event_participant',
                displayType: 'Event Participant',
                event_title: json.participant.event_title,
                checkin_time: json.participant.checkin_time
              });
              setError("");
            } else {
              console.error("❌ Event Participant Check-in Failed:", json.error);
              
              // Handle specific event participant error cases
              if (json.error && json.error.includes('already been checked in')) {
                setError("This participant has already been checked in.");
              } else if (json.error && json.error.includes('cancelled')) {
                setError("This registration has been cancelled and cannot be checked in.");
              } else if (json.error && json.error.includes('not approved')) {
                setError("This registration is not approved yet.");
              } else {
                setError(json.error || "Failed to check in event participant");
              }
            }
          } else if (qrData.type === 'additional_visitor') {
            console.log("🎯 Detected: Additional Visitor QR Code (JSON format)");
            console.log("🔍 Additional Visitor QR Data:", qrData);
            
            // Call the additional visitor check-in API with QR code data
            const apiUrl = `${API_BASE_URL}/api/additional-visitors/${qrData.tokenId}/checkin`;
            console.log("🌐 Sending request to:", apiUrl);
            
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                qrCodeData: decodedText // Pass the full QR code data to the backend
              })
            });
            
            console.log("📡 API Response Status:", res.status);
            const json = await res.json();
            console.log("📋 API Response Data:", json);
            
            if (json.success) {
              console.log("✅ Additional Visitor Visit Success!");
              console.log("👤 Visitor Data:", json.visitor);
              
              // Check if this is actually a walk-in visitor based on booking type or other identifiers
              const isWalkInVisitor = json.visitor.bookingType === 'ind-walkin' || 
                                    json.visitor.bookingType === 'group-walkin' ||
                                    json.visitor.visitorType === 'walkin_visitor' ||
                                    (qrData.tokenId && (qrData.tokenId.startsWith('WALKIN-') || 
                                                       qrData.tokenId.startsWith('INDWALKIN-') || 
                                                       qrData.tokenId.startsWith('GROUPWALKIN-')));
              
              if (isWalkInVisitor) {
                console.log("🎯 Detected as Walk-in Visitor!");
                // Modify the visitor data to show it's a walk-in visitor
                const walkInVisitorData = {
                  ...json.visitor,
                  visitorType: 'walkin_visitor',
                  displayType: 'Walk-in Visitor'
                };
                setVisitor(walkInVisitorData);
              } else {
                setVisitor(json.visitor);
              }
              setError("");
            } else {
              console.error("❌ Additional Visitor Check-in Failed:", json.error);
              console.error("❌ Error Status:", json.status);
              console.error("❌ Full Error Response:", json);
              setError(json.error || "Failed to process visitor QR code");
            }
          } else if (qrData.type === 'walkin_visitor') {
            console.log("🎯 Processing as Walk-in Visitor");
            console.log("🔍 Walk-in Visitor QR Data:", qrData);
            
            // Check if this is a group walk-in leader or member
            if (qrData.isGroupLeader) {
              console.log("🎯 Processing as Group Walk-in Leader");
              const apiUrl = `${API_BASE_URL}/api/group-walkin-leaders/${qrData.visitorId}/checkin`;
              console.log("🌐 Sending request to:", apiUrl);
              
              const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              console.log("📡 API Response Status:", res.status);
              const json = await res.json();
              console.log("📋 API Response Data:", json);
              
              if (json.success) {
                console.log("✅ Group Walk-in Leader Visit Success!");
                setVisitor({
                  ...json.visitor,
                  visitorType: 'group_walkin_leader',
                  displayType: 'Group Walk-in Leader'
                });
                setError("");
                setIncompleteFormError(null);
              } else {
                console.error("❌ Group Walk-in Leader Check-in Failed:", json.error);
                // Check if this is an incomplete form error
                if (json.status === 'incomplete' || json.status === 'form-incomplete') {
                  setIncompleteFormError({
                    message: INCOMPLETE_INFO_MESSAGE,
                    missingFields: json.missingFields || [],
                    email: json.email
                  });
                  setScanned("");
                  setError("");
                } else {
                  setError(json.error || "Failed to process group walk-in leader QR code");
                }
              }
            } else if (qrData.visitorId && typeof qrData.visitorId === 'string' && qrData.visitorId.startsWith('GROUP-')) {
              console.log("🎯 Processing as Group Walk-in Member");
              // Extract the token part from GROUP-{bookingId}-{tokenId} format
              const parts = qrData.visitorId.split('-');
              const memberVisitorId = parts.slice(2).join('-'); // Get everything after GROUP-{bookingId}-
              console.log("🔍 Extracted member visitor ID:", memberVisitorId);
              console.log("🔍 Full QR visitorId:", qrData.visitorId);
              const apiUrl = `${API_BASE_URL}/api/group-walkin-members/${memberVisitorId}/checkin`;
              console.log("🌐 Sending request to:", apiUrl);
              
              const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              console.log("📡 API Response Status:", res.status);
              const json = await res.json();
              console.log("📋 API Response Data:", json);
              
              if (json.success) {
                console.log("✅ Group Walk-in Member Visit Success!");
                const visitorData = {
                  ...json.visitor,
                  visitorType: 'group_walkin_member',
                  displayType: 'Group Walk-in Member'
                };
                if (isVisitorInfoIncomplete(visitorData)) {
                  console.warn('⚠️ Companion visitor information incomplete. Prompting user to complete details.');
                  setVisitor(null);
                  setIncompleteFormError({ message: INCOMPLETE_INFO_MESSAGE, missingFields: json.missingFields || [] });
                  setScanned("");
                } else {
                  setVisitor(visitorData);
                  setError("");
                  setIncompleteFormError(null);
                }
              } else {
                console.error("❌ Group Walk-in Member Check-in Failed:", json.error);
                if (json.status === 'incomplete' || json.status === 'form-incomplete') {
                  setIncompleteFormError({
                    message: INCOMPLETE_INFO_MESSAGE,
                    missingFields: json.missingFields || [],
                    email: json.email
                  });
                  setScanned("");
                  setError("");
                } else {
                  setError(json.error || "Failed to process group walk-in member QR code");
                }
              }
            } else {
              // Handle regular individual walk-in visitor
              console.log("🎯 Processing as Individual Walk-in Visitor");
              console.log("🔍 Individual Walk-in Visitor QR Data:", qrData);
              
              const apiUrl = `${API_BASE_URL}/api/walkin-visitors/${qrData.visitorId}/checkin`;
              console.log("🌐 Sending request to:", apiUrl);
              
              const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              console.log("📡 API Response Status:", res.status);
              const json = await res.json();
              console.log("📋 API Response Data:", json);
              
              if (json.success) {
                console.log("✅ Individual Walk-in Visitor Visit Success!");
                const visitorData = {
                  ...json.visitor,
                  visitorType: 'walkin_visitor',
                  displayType: 'Walk-in Visitor'
                };
                if (isVisitorInfoIncomplete(visitorData)) {
                  console.warn('⚠️ Walk-in visitor information incomplete. Prompting user to complete details.');
                  setVisitor(null);
                  setIncompleteFormError({ message: INCOMPLETE_INFO_MESSAGE, missingFields: json.missingFields || [] });
                  setScanned("");
                } else {
                  setVisitor(visitorData);
                  setError("");
                  setIncompleteFormError(null);
                }
              } else {
                console.error("❌ Individual Walk-in Visitor Check-in Failed:", json.error);
                // Check if this is an incomplete form error
                if (json.status === 'incomplete' || json.status === 'form-incomplete') {
                  setIncompleteFormError({
                    message: INCOMPLETE_INFO_MESSAGE,
                    missingFields: json.missingFields || [],
                    email: json.email
                  });
                  setScanned("");
                  setError("");
                } else {
                  setError(json.error || "Failed to process individual walk-in visitor QR code");
                }
              }
            }
          } else if (qrData.type === 'primary_visitor') {
            console.log("🎯 Processing as Legacy Primary Visitor");
            
            const apiUrl = `${API_BASE_URL}/api/slots/visit/qr-scan`;
            console.log("🌐 Sending request to:", apiUrl);
            
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ qrData: decodedText })
            });
            
            console.log("📡 API Response Status:", res.status);
            const json = await res.json();
            console.log("📋 API Response Data:", json);
            
            if (json.success) {
              console.log("✅ Legacy Primary Visitor Visit Success!");
              setVisitor(json.visitor);
              setError("");
              setIncompleteFormError(null);
            } else {
              console.error("❌ Legacy Primary Visitor Check-in Failed:", json.error);
              // Check if this is an incomplete form error
              if (json.status === 'incomplete' || json.status === 'form-incomplete') {
                setIncompleteFormError({
                  message: INCOMPLETE_INFO_MESSAGE,
                  missingFields: json.missingFields || [],
                  email: json.email
                });
                setScanned("");
                setError("");
              } else {
                setError(json.error || "Failed to process primary visitor QR code");
              }
            }
          } else {
            console.error("❌ Invalid QR code type:", qrData.type);
            setError("Invalid QR code type. Expected 'event_participant', 'additional_visitor', 'primary_visitor', 'walkin_visitor', 'group_member', or 'group_walkin_leader'.");
          }
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError);
          console.error("❌ Raw data that failed to parse:", JSON.stringify(decodedText));
          console.error("❌ Parse error details:", parseError.message);
          setError(`Invalid QR code format. Expected check-in URL or valid JSON data. Parse error: ${parseError.message}`);
        }
      }
      
      console.log("🔍 === QR SCANNER DEBUG END ===");
    } catch (err) {
      console.error("❌ === QR SCANNER ERROR ===");
      console.error("❌ Error details:", err);
      console.error("❌ Error message:", err.message);
      console.error("❌ Error stack:", err.stack);
      setError(err.message || "Failed to process QR code");
    }
  };

  const handleManualInput = async () => {
    if (!manualInput.trim()) {
      setError("Please enter a QR code or check-in URL");
      return;
    }

    try {
      setError("");
      setScanned("");
      setVisitor(null);
      
      console.log("Manual input - processing:", manualInput);
      setScanned(manualInput);
      await processQRCode(manualInput);
    } catch (err) {
      console.error("Error processing manual input:", err);
      setError("Failed to process manual input. Please check the format and try again.");
    }
  };

  const handleBackupCode = async () => {
    if (!backupCode.trim()) {
      setError("Please enter the visitor ID, token, registration ID, or participant ID");
      return;
    }

    try {
      setError("");
      setIncompleteFormError(null); // Clear incomplete form error
      setScanned("");
      setVisitor(null);
      setIsCheckingIn(true);
      
      console.log("Backup code - processing:", backupCode, "Type:", checkInType);
      
      // Handle based on user selection
      if (checkInType === 'event') {
        console.log("🎯 Event Participant Check-in (User Selected)");
        
        const eventResponse = await fetch(`${API_BASE_URL}/api/event-registrations/checkin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registration_id: backupCode.trim(),
            manual_checkin: true
          })
        });
        
        const eventJson = await eventResponse.json();
        
        if (eventJson.success) {
          console.log("✅ Event Participant Manual Check-in Success!");
          setVisitor({
            ...eventJson.participant,
            visitorType: 'event_participant',
            displayType: 'Event Participant',
            event_title: eventJson.participant.event_title,
            checkin_time: eventJson.participant.checkin_time
          });
          setError("");
          setScanned(`Event Participant: ${backupCode}`);
        } else {
          setError(eventJson.error || "Event participant not found or not approved");
        }
      } else {
        console.log("🎯 Regular Visitor Check-in (User Selected)");
        
        const visitorResponse = await fetch(`${API_BASE_URL}/api/backup-codes/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: backupCode
          })
        });
        
        const visitorJson = await visitorResponse.json();
        
        console.log("📋 Backup Code Validation Response:", visitorJson);
        
        if (visitorJson.success) {
          console.log("✅ Visitor ID validated successfully");
          if (isVisitorInfoIncomplete(visitorJson.visitor)) {
            console.warn('⚠️ Visitor information incomplete (backup code). Prompting user to complete details.');
            setVisitor(null);
            setIncompleteFormError({ message: INCOMPLETE_INFO_MESSAGE, missingFields: visitorJson.missingFields || [] });
            setScanned("");
          } else {
            setVisitor(visitorJson.visitor);
            setError("");
            setIncompleteFormError(null);
            setScanned(`Visitor ID: ${backupCode}`);
          }
        } else {
          // Check if this is an incomplete form error
          if (visitorJson.status === 'incomplete' || visitorJson.status === 'form-incomplete') {
            setIncompleteFormError({
              message: INCOMPLETE_INFO_MESSAGE,
              missingFields: visitorJson.missingFields || [],
              email: visitorJson.email
            });
            setScanned("");
            setError(""); // Clear regular error
          } else {
            // Show detailed error message including missing fields if available
            let errorMessage = visitorJson.error || "Visitor not found";
            if (visitorJson.missingFields && visitorJson.missingFields.length > 0) {
              errorMessage += ` Missing: ${visitorJson.missingFields.join(', ')}`;
            }
            setIncompleteFormError(null); // Clear incomplete form error
            setError(errorMessage);
          }
          console.error("❌ Backup Code Validation Failed:", {
            error: visitorJson.error,
            status: visitorJson.status,
            missingFields: visitorJson.missingFields,
            message: visitorJson.message
          });
        }
      }
    } catch (err) {
      console.error("Error processing backup code:", err);
      setError("Failed to process backup code. Please check the code and try again.");
    } finally {
      setIsCheckingIn(false);
    }
  };



  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const resetScanner = () => {
    setScanned("");
    setVisitor(null);
    setError("");
    setIncompleteFormError(null);
    setCameraError("");
    setManualInput("");
    setBackupCode("");
    setInputMode("qr");
    setShowManualInput(false);
    if (isScanning) {
      stopScanner();
    }
  };





  useEffect(() => {
    // Check camera permission on mount
    checkCameraPermission();
    

    
    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-2">
      <div className="max-w-4xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg" style={{backgroundColor: '#E5B80B'}}>
              <i className="fa-solid fa-qrcode text-2xl text-white"></i>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold mb-1" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                Scanner
              </h1>
              <p className="text-base text-gray-600" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Scan QR codes for visitors and event participants
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {/* Scanner Section */}
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  QR Scanner
                </h2>
                <p className="text-sm text-gray-600" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  Point your camera at a QR code
                </p>
              </div>

        {/* Security Warning */}
        {!isSecure && (
              <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  <i className="fa-solid fa-exclamation-triangle mr-2 text-amber-600"></i>
                  Camera Access Notice
            </h3>
                <div className="text-sm text-amber-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
              Camera access requires HTTPS connection. Please use manual input as backup.
            </div>
          </div>
        )}
        
        {/* Camera Error */}
        {cameraError && (
              <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  <i className="fa-solid fa-camera-slash mr-2 text-red-600"></i>
                  Camera Error
            </h3>
                <div className="text-sm text-red-700" style={{fontFamily: 'Telegraf, sans-serif'}}>{cameraError}</div>
          </div>
        )}
        
            {/* Modern Scanner Container */}
            <div className="mb-4">
              <div 
                id="qr-reader" 
                ref={scannerRef} 
                className="w-full mx-auto rounded-3xl overflow-hidden shadow-2xl border-4"
                style={{ height: 400, borderColor: '#E5B80B' }}
              />
              
              {/* Modern Scanner Status */}
              <div className="mt-4 text-center">
                {isScanning ? (
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <i className="fa-solid fa-camera mr-2"></i>
                    Scanning for QR code...
                  </div>
                ) : (
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-full" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    <i className="fa-solid fa-pause mr-2"></i>
                    Scanner ready
                  </div>
                )}
              </div>
            </div>

            {/* Compact Control Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {!isScanning ? (
                <button
                  onClick={startScanner}
                  disabled={!cameraPermission}
                  className="flex items-center justify-center py-2 px-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
                  style={{backgroundColor: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#D4A509')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#E5B80B')}
                >
                  <i className="fa-solid fa-play mr-1 text-xs"></i>
                  Start Scanner
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="flex items-center justify-center py-2 px-3 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                  style={{backgroundColor: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2A1A0D'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#351E10'}
                >
                  <i className="fa-solid fa-stop mr-1 text-xs"></i>
                  Stop Scanner
                </button>
              )}
              <button
                onClick={resetScanner}
                className="flex items-center justify-center py-2 px-3 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                style={{backgroundColor: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2A1A0D'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#351E10'}
              >
                <i className="fa-solid fa-refresh mr-1 text-xs"></i>
                Reset
              </button>
            </div>

            {/* Compact Manual Check-In Toggle */}
            <div className="mb-3">
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="w-full py-2 px-3 rounded-lg transition-all duration-200 border-2 shadow-md hover:shadow-lg text-sm"
                style={{backgroundColor: '#351E10', color: 'white', borderColor: '#351E10', fontFamily: 'Telegraf, sans-serif'}}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2A1A0D';
                  e.target.style.borderColor = '#2A1A0D';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#351E10';
                  e.target.style.borderColor = '#351E10';
                }}
              >
                <i className="fa-solid fa-key mr-1 text-xs"></i>
                {showManualInput ? 'Hide Manual Check-In' : 'Show Manual Check-In'}
              </button>
            </div>

            {/* Modern Manual Input Section */}
            {showManualInput && (
              <div className="mb-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 shadow-lg" style={{borderColor: '#351E10'}}>
                  <h3 className="font-semibold mb-3 flex items-center" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                    <i className="fa-solid fa-key mr-2 text-lg" style={{color: '#E5B80B'}}></i>
                    Manual Check-In
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={
                          checkInType === 'visitor' 
                            ? "Enter visitor ID or backup code..." 
                            : "Enter registration ID or participant ID..."
                        }
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-xl focus:outline-none transition-all duration-200 shadow-sm"
                        style={{fontFamily: 'Telegraf, sans-serif', borderColor: '#351E10', focusBorderColor: '#E5B80B'}}
                        onKeyPress={(e) => e.key === 'Enter' && handleBackupCode()}
                        disabled={isCheckingIn}
                      />
                    </div>
                    
                    {/* Check-in Type Selection */}
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        Select Check-in Type:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setCheckInType('visitor')}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            checkInType === 'visitor' 
                              ? 'bg-green-500 text-white shadow-md' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        >
                          <i className="fa-solid fa-user mr-1"></i>
                          Visitor
                        </button>
                        <button
                          onClick={() => setCheckInType('event')}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            checkInType === 'event' 
                              ? 'bg-purple-500 text-white shadow-md' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          style={{fontFamily: 'Telegraf, sans-serif'}}
                        >
                          <i className="fa-solid fa-calendar-check mr-1"></i>
                          Event
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleBackupCode}
                      disabled={isCheckingIn}
                      className="w-full text-white py-2 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{backgroundColor: '#E5B80B', fontFamily: 'Telegraf, sans-serif'}}
                      onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#D4A509')}
                      onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#E5B80B')}
                    >
                      {isCheckingIn ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                          Checking In...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-check mr-2"></i>
                          {checkInType === 'visitor' ? 'Check In Visitor' : 'Check In Event Participant'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Instructions - Moved up to fill space */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 rounded-xl p-4 shadow-lg" style={{borderColor: '#351E10'}}>
              <h3 className="font-semibold mb-3 flex items-center text-sm" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                <i className="fa-solid fa-info-circle mr-2" style={{color: '#E5B80B'}}></i>
                Quick Instructions
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E5B80B'}}>
                    <i className="fa-solid fa-camera text-white text-xs"></i>
                  </div>
                  <span style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Point camera at QR code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E5B80B'}}>
                    <i className="fa-solid fa-key text-white text-xs"></i>
                  </div>
                  <span style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Manual input</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E5B80B'}}>
                    <i className="fa-solid fa-refresh text-white text-xs"></i>
                  </div>
                  <span style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>Reset</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E5B80B'}}>
                    <i className="fa-solid fa-lock text-white text-xs"></i>
                  </div>
                  <span style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>HTTPS required</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border-2" style={{borderColor: '#351E10'}}>
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold mb-2" style={{color: '#351E10', fontFamily: 'Telegraf, sans-serif'}}>
                  Check-In Results
                </h2>
                <p className="text-sm text-gray-600" style={{fontFamily: 'Telegraf, sans-serif'}}>
                  View visitor information and status
                </p>
              </div>


            {/* Modern Results */}
            <div className="space-y-3">
          
          {visitor && (
                <div className={`border-2 rounded-2xl p-6 shadow-lg ${
              visitor.visitorType === 'event_participant' && visitor.status === 'cancelled' 
                    ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' 
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            }`}>
                  <h3 className={`font-semibold mb-4 text-lg ${
                visitor.visitorType === 'event_participant' && visitor.status === 'cancelled'
                  ? 'text-red-800'
                  : 'text-green-800'
                  }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                    <i className={`mr-3 text-xl ${
                  visitor.visitorType === 'event_participant' && visitor.status === 'cancelled'
                    ? 'fa-solid fa-times-circle text-red-600'
                    : 'fa-solid fa-user-check text-green-600'
                }`}></i>
                {visitor.visitorType === 'event_participant' 
                  ? (visitor.status === 'cancelled' ? 'Event Registration Cancelled' : 'Event Participant Checked In!')
                  : (visitor.displayType || (visitor.visitorType === 'walkin_visitor' ? 'Walk-in Visitor' : 
                     'Visitor')) + ' Visited Successfully!'
                }
              </h3>
              
                  {/* Modern Event Participant Information */}
              {visitor.visitorType === 'event_participant' && (
                    <div className="mb-6 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>Event:</span>
                          <span className="text-gray-600 font-semibold" style={{fontFamily: 'Telegraf, sans-serif'}}>{visitor.event_title}</span>
                  </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      visitor.status === 'cancelled' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                          }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                      {visitor.status === 'cancelled' ? 'Cancelled' : 'Attended'}
                    </span>
                  </div>
                  {visitor.event_status && (
                    <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700" style={{fontFamily: 'Telegraf, sans-serif'}}>Event Status:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        visitor.event_status === 'ended' 
                          ? 'bg-red-100 text-red-800'
                          : visitor.event_status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                            }`} style={{fontFamily: 'Telegraf, sans-serif'}}>
                        {visitor.event_status === 'ended' ? 'Event Ended' :
                         visitor.event_status === 'in_progress' ? 'Event In Progress' : 'Event Not Started'}
                      </span>
                    </div>
                  )}
                      </div>
                </div>
              )}
              
                  {/* Event Participant Display */}
                  {visitor.visitorType === 'event_participant' ? (
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                      <div className="grid grid-cols-1 gap-3 text-sm" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="text-gray-600">
                            {(() => {
                              const firstName = visitor.firstname || visitor.firstName || visitor.first_name || '';
                              const lastName = visitor.lastname || visitor.lastName || visitor.last_name || '';
                              const fullName = `${firstName} ${lastName}`.trim();
                              return fullName || 'Not provided';
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Email:</span>
                          <span className="text-gray-600">{visitor.email || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Gender:</span>
                          <span className="text-gray-600">{visitor.gender || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Visitor Type:</span>
                          <span className="text-gray-600">Event Participant</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Check-in Time:</span>
                          <span className="text-gray-600">
                            {(() => {
                              const checkinTime = visitor.checkin_time || visitor.scanTime;
                              if (!checkinTime) {
                                return 'Not set';
                              }
                              try {
                                const date = new Date(checkinTime);
                                if (isNaN(date.getTime())) {
                                  return 'Invalid Date';
                                }
                                return date.toLocaleString();
                              } catch (error) {
                                return 'Invalid Date';
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Regular Visitor Display */
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                      <div className="grid grid-cols-1 gap-3 text-sm" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="text-gray-600">
                            {(() => {
                              const firstName = visitor.firstName || visitor.first_name || '';
                              const lastName = visitor.lastName || visitor.last_name || '';
                              const fullName = `${firstName} ${lastName}`.trim();
                              return fullName || 'Not provided';
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Email:</span>
                          <span className="text-gray-600">{visitor.email || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Gender:</span>
                          <span className="text-gray-600">{visitor.gender || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Visitor Type:</span>
                          <span className="text-gray-600">
                            {(() => {
                              if (visitor.visitorType === 'walkin_visitor') return 'Walk-in Visitor';
                              if (visitor.visitorType === 'group_walkin_leader') return 'Group Walk-in Leader';
                              if (visitor.visitorType === 'group_walkin_member') return 'Group Walk-in Member';
                              if (visitor.displayType) return visitor.displayType;
                              return visitor.visitorType || 'Additional Visitor';
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Address:</span>
                          <span className="text-gray-600">{visitor.address || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Visit Date:</span>
                          <span className="text-gray-600">
                            {(() => {
                              const visitDate = visitor.visitDate || visitor.visit_date;
                              if (!visitDate) return 'Not specified';
                              try {
                                const date = new Date(visitDate);
                                if (isNaN(date.getTime())) return 'Invalid Date';
                                return date.toLocaleDateString();
                              } catch (error) {
                                return 'Invalid Date';
                              }
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Time Slot:</span>
                          <span className="text-gray-600">{visitor.visitTime || visitor.visit_time || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Institution:</span>
                          <span className="text-gray-600">{visitor.institution || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Purpose:</span>
                          <span className="text-gray-600">{visitor.purpose || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Check-in Time:</span>
                          <span className="text-gray-600">
                            {(() => {
                              const checkinTime = visitor.checkin_time || visitor.scanTime;
                              if (!checkinTime) {
                                return 'Not set';
                              }
                              try {
                                const date = new Date(checkinTime);
                                if (isNaN(date.getTime())) {
                                  return 'Invalid Date';
                                }
                                return date.toLocaleString();
                              } catch (error) {
                                return 'Invalid Date';
                              }
                            })()}
                          </span>
                        </div>
                        {visitor.groupLeader && visitor.groupLeader !== 'N/A' && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Group Leader:</span>
                            <span className="text-gray-600">{visitor.groupLeader}</span>
                          </div>
                        )}
                        {visitor.detailsCompleted !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Details Completed:</span>
                            <span className="text-gray-600">{visitor.detailsCompleted ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {visitor.bookingType && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Type:</span>
                            <span className="text-gray-600">{visitor.bookingType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                {visitor.allVisitors && visitor.allVisitors.length > 1 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
                        <i className="fa-solid fa-users mr-3 text-lg" style={{color: '#E5B80B'}}></i>
                        All Visitors in This Booking
                    </h4>
                      <div className="space-y-3">
                      {visitor.allVisitors.map((v, index) => (
                          <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-2xl border border-gray-200" style={{fontFamily: 'Telegraf, sans-serif'}}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">
                              {v.firstName} {v.lastName}
                              {v.isPrimary && (
                                  <span className="ml-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">Primary</span>
                              )}
                            </span>
                            <span className="text-gray-600">{v.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
          
              {/* Modern Success Message */}
          {scanned && !error && !incompleteFormError && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    <i className="fa-solid fa-check-circle mr-3 text-green-600"></i>
                QR Code Scanned Successfully!
              </h3>
                  <div className="text-sm text-green-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                Processing visitor information...
              </div>
            </div>
          )}

              {/* Incomplete Form Error Message - Special handling for walk-in visitors */}
          {incompleteFormError && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl p-6 shadow-lg">
                  <h3 className="font-semibold text-amber-900 mb-3 flex items-center text-lg" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    <i className="fa-solid fa-exclamation-circle mr-3 text-amber-600 text-xl"></i>
                    Visitor Haven't Complete Their Details
              </h3>
                  <div className="text-sm text-amber-800 mb-4 font-semibold" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    This visitor has not completed their required information. Please complete all required fields before checking in.
              </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800" style={{fontFamily: 'Telegraf, sans-serif'}}>
                      <i className="fa-solid fa-info-circle mr-2"></i>
                      Please check your email for the registration link and complete all required fields before checking in.
                    </p>
                  </div>
            </div>
          )}

              {/* Modern Error Message */}
          {error && !incompleteFormError && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 shadow-lg">
                  <h3 className="font-semibold text-red-800 mb-3 flex items-center" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    <i className="fa-solid fa-exclamation-triangle mr-3 text-red-600"></i>
                    Check-in Error
              </h3>
                  <div className="text-sm text-red-700" style={{fontFamily: 'Telegraf, sans-serif'}}>{error}</div>
            </div>
          )}

              {/* Modern Success Check-in Message */}
              {visitor && !error && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 shadow-lg">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center text-sm" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    <i className="fa-solid fa-check-circle mr-2 text-green-600"></i>
                    Check-in Successful
                  </h3>
                  <div className="text-xs text-green-700" style={{fontFamily: 'Telegraf, sans-serif'}}>
                    Visitor has been checked in successfully.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VisitorScanner; 