# Network Access Setup Guide

## Problem
When accessing the site using network IPs (http://192.168.56.1:5173/ or http://192.168.1.6:5173/), the frontend loads but the database doesn't work because the backend/server is not properly connected over the network.

## Root Causes
1. **Backend server** not accessible from network IPs
2. **Database** not configured for external connections
3. **CORS** not configured for network IPs
4. **Firewall** blocking connections
5. **MySQL** bind_address restricted to localhost

## Solution Steps

### 1. ✅ Backend Server Configuration (Already Fixed)
- ✅ Server listening on `0.0.0.0:3000` (allows external connections)
- ✅ CORS updated to include network IPs:
  - `http://192.168.56.1:5173`
  - `http://192.168.1.6:5173`

### 2. ✅ Frontend API Configuration (Already Fixed)
- ✅ Dynamic backend URL detection based on hostname
- ✅ Automatically uses correct backend IP

### 3. 🔧 Database Configuration (Needs Setup)

#### Step 3.1: Configure MySQL for Network Access

**Find MySQL Configuration File:**
- Windows: `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`
- Or: `C:\Program Files\MySQL\MySQL Server 8.0\my.ini`

**Edit my.ini:**
```ini
[mysqld]
# Change this line:
bind-address = 0.0.0.0
# Instead of:
# bind-address = 127.0.0.1
```

#### Step 3.2: Grant Network Access to MySQL User

**Connect to MySQL as root:**
```bash
mysql -u root -p
```

**Grant network access:**
```sql
-- Grant access from any IP address
GRANT ALL PRIVILEGES ON museosmart.* TO 'root'@'%' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;

-- Or create a specific user for network access
CREATE USER 'museoo_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON museosmart.* TO 'museoo_user'@'%';
FLUSH PRIVILEGES;
```

#### Step 3.3: Restart MySQL Service
```bash
# Windows (Run as Administrator)
net stop mysql80
net start mysql80

# Or restart from Services app
```

### 4. 🔧 Windows Firewall Configuration

**Allow Node.js through firewall:**
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings" (requires admin)
4. Click "Allow another app"
5. Browse to: `C:\Program Files\nodejs\node.exe`
6. Make sure both Private and Public are checked

**Allow MySQL through firewall:**
1. Same process as above
2. Browse to MySQL executable (usually in Program Files)
3. Or add port 3306 manually

### 5. 🔧 Environment Variables

**Create/Update .env file in backend folder:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=museosmart
DB_PORT=3306
NODE_ENV=development
```

### 6. 🧪 Testing Network Access

**Run the diagnostic script:**
```bash
cd backend
node scripts/check_network_access.js
```

**Test backend directly:**
```bash
# From another device on the network
curl http://192.168.1.6:3000/
# Should return: "Backend is running!"
```

**Test database connection:**
```bash
# From another device
mysql -h 192.168.1.6 -u root -p museosmart
```

### 7. 🚀 Starting the Application

**Start Backend:**
```bash
cd backend
npm start
# Should show: "Server running at http://localhost:3000"
# Should show: "External access: http://YOUR_IP:3000"
```

**Start Frontend:**
```bash
cd Museoo
npm run dev
# Should show network URLs in addition to localhost
```

### 8. 🔍 Troubleshooting

**Common Issues:**

1. **"Connection refused" errors:**
   - Check if backend is running
   - Check firewall settings
   - Verify CORS configuration

2. **"Access denied" database errors:**
   - Check MySQL user permissions
   - Verify bind-address setting
   - Check password in .env file

3. **CORS errors in browser:**
   - Verify IP is in allowedOrigins array
   - Check browser console for specific errors

4. **"Cannot connect to database":**
   - Run diagnostic script
   - Check MySQL service is running
   - Verify network permissions

**Debug Commands:**
```bash
# Check if ports are open
netstat -an | findstr :3000
netstat -an | findstr :3306

# Check MySQL status
sc query mysql80

# Test network connectivity
ping 192.168.1.6
telnet 192.168.1.6 3000
telnet 192.168.1.6 3306
```

## Security Considerations

⚠️ **Important:** This setup allows network access to your database. For production:

1. Use strong passwords
2. Limit database user permissions
3. Use VPN or secure network
4. Consider using a reverse proxy
5. Implement rate limiting
6. Use HTTPS in production

## Success Indicators

✅ **Working correctly when:**
- Frontend loads at network IP
- Events/exhibits data loads
- Login works
- All API calls succeed
- No CORS errors in browser console
- No database connection errors in backend logs
