# 📱 Phone Access Setup Guide

This guide will help you access your Museoo website on your phone to test the QR scanner functionality.

## 🚀 Quick Start (Windows)

1. **Double-click** `start-servers.bat` in your project folder
2. Wait for both servers to start
3. Note the IP address shown in the console
4. On your phone, open: `http://YOUR_IP:5173`

## 🔧 Manual Setup

### Prerequisites
- Your phone and computer must be on the same WiFi network
- Node.js installed on your computer
- All dependencies installed

### Step 1: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../Museoo
npm install
```

### Step 2: Start Backend Server
```bash
cd backend
npm start
```
The backend will run on `http://localhost:3000`

### Step 3: Start Frontend Server
```bash
cd Museoo
npm run dev
```
The frontend will run on `http://localhost:5173`

### Step 4: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter.

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

### Step 5: Access on Your Phone
1. Make sure your phone is connected to the same WiFi network
2. Open your phone's browser
3. Navigate to: `http://YOUR_COMPUTER_IP:5173`
   - Example: `http://192.168.1.100:5173`

## 🔍 Troubleshooting

### Can't Access the Website?
1. **Check Firewall**: Windows Firewall might block the connection
   - Go to Windows Defender Firewall
   - Allow Node.js through the firewall
   
2. **Check Network**: Ensure both devices are on the same network
   - Try accessing from another device on the same network first

3. **Check Ports**: Make sure ports 3000 and 5173 are not blocked
   - Try different ports if needed

### QR Scanner Not Working?
1. **Camera Permissions**: Allow camera access when prompted
2. **HTTPS Required**: Some browsers require HTTPS for camera access
   - Use ngrok for HTTPS tunneling (see alternative setup below)

## 🌐 Alternative: Using ngrok (Recommended for Production Testing)

If you need HTTPS or want to access from anywhere:

### Install ngrok
1. Download from https://ngrok.com/
2. Sign up for a free account
3. Add ngrok to your PATH

### Create HTTPS Tunnel
```bash
# After starting your servers, run:
ngrok http 5173
```

This will give you a public HTTPS URL like: `https://abc123.ngrok.io`

### Benefits of ngrok
- ✅ HTTPS (required for camera access on some browsers)
- ✅ Works from anywhere (not just same network)
- ✅ Real-time request inspection
- ✅ No firewall issues

## 📱 Testing QR Scanner

1. **Access the admin panel** on your computer
2. **Generate QR codes** for exhibits or events
3. **Open the website on your phone**
4. **Navigate to the QR scanner page**
5. **Scan the generated QR codes**

## 🔒 Security Notes

- This setup is for **development/testing only**
- Don't use this configuration in production
- The servers are configured to accept connections from any IP on your local network
- Consider using ngrok or proper hosting for production deployment

## 🆘 Need Help?

If you're still having issues:
1. Check the console output for error messages
2. Ensure all dependencies are installed
3. Try accessing the backend directly: `http://YOUR_IP:3000`
4. Check if your antivirus/firewall is blocking the connections 