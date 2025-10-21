import React, { useState } from 'react';
import QRCode from 'qrcode';

const TestQRGenerator = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');

  const generateTestQR = async () => {
    try {
      // Generate a test check-in URL
      const testUrl = `${window.location.origin}/api/visit/checkin/test-visitor-123`;
      setQrCodeUrl(testUrl);
      
      // Generate QR code image
      const qrImage = await QRCode.toDataURL(testUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#2e2b41',
          light: '#ffffff'
        }
      });
      
      setQrCodeImage(qrImage);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-[#2e2b41] mb-4">
        <i className="fa-solid fa-qrcode mr-2 text-[#AB8841]"></i>
        Test QR Code Generator
      </h2>
      
      <div className="space-y-4">
        <button
          onClick={generateTestQR}
          className="w-full bg-[#AB8841] text-white py-2 px-4 rounded-lg hover:bg-[#8B6B21] transition-colors"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Generate Test QR Code
        </button>
        
        {qrCodeUrl && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Test Check-in URL:</p>
            <p className="text-xs text-gray-500 break-all mb-4">{qrCodeUrl}</p>
          </div>
        )}
        
        {qrCodeImage && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Scan this QR code to test:</p>
            <img 
              src={qrCodeImage} 
              alt="Test QR Code" 
              className="mx-auto border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-2">
              Use this QR code to test the scanner functionality
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestQRGenerator; 