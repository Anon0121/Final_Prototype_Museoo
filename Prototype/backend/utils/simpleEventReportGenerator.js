// Simple Event Report Generator - Just lists of events and participants
const path = require('path');
const fs = require('fs');

// Function to convert logo images to base64
function getBase64Logo(filename) {
  try {
    // Use the same path structure as the working visitor PDF generator
    const logoPath = path.join(__dirname, '../../Museoo/src/assets', filename);
    
    console.log(`🔍 Debug: Loading logo: ${filename} from ${logoPath}`);
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const base64 = logoBuffer.toString('base64');
      console.log(`✅ Logo ${filename} loaded, base64 length: ${base64.length}`);
      console.log(`🔍 Debug: First 50 chars: ${base64.substring(0, 50)}`);
      return base64;
    } else {
      console.log(`❌ Logo file not found: ${logoPath}`);
    }
  } catch (error) {
    console.error(`Error reading logo ${filename}:`, error);
  }
  return '';
}

// Generate simple list of events report
function generateEventListReport(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
      console.log('📊 Event list report data keys:', Object.keys(reportData));
    } catch (e) {
      console.error('Error parsing event list report data:', e);
    }
  }

  const events = reportData.events || [];
  const totalEvents = events.length;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Event List Report - Cagayan de Oro City Museum</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #000;
            line-height: 1.4;
            background: #ffffff;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding: 0;
        }
        
        .seal {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
        }
        
        .seal img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .museum-info {
            text-align: center;
            flex: 1;
            margin: 0 20px;
        }
        
        .museum-name {
            font-size: 20px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        
        .museum-address {
            font-size: 12px;
            color: #666;
            line-height: 1.3;
        }
        
        .city-logo {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
        }
        
        .city-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .report-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin: 30px 0;
        }
        
        .total-events {
            text-align: right;
            font-size: 14px;
            margin-bottom: 20px;
            color: #000;
        }
        
        .events-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 20px;
        }
        
        .events-table th,
        .events-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        .events-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .events-table td {
            text-align: left;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="seal">
            <img src="data:image/png;base64,${getBase64Logo('logo.png')}" alt="City Seal" />
        </div>
        <div class="museum-info">
            <div class="museum-name">Cagayan de Oro City Museum</div>
            <div class="museum-address">
                Fernandez-Rizal Streets, Barangay 1, Old Water Tower/Tank,<br>
                near Gaston Park, Cagayan de Oro, Philippines
            </div>
        </div>
        <div class="city-logo">
            <img src="data:image/png;base64,${getBase64Logo('Logo_cagayan_de oro_city.png')}" alt="City Logo" />
        </div>
    </div>

    <div class="report-title">Event List Report</div>

    <div class="total-events">Total Events: ${totalEvents}</div>

    <table class="events-table">
        <thead>
            <tr>
                <th>Event Name</th>
                <th>Location</th>
                <th>Total Slot</th>
                <th>Date and Time</th>
            </tr>
        </thead>
        <tbody>
            ${events.map(event => `
                <tr>
                    <td>${event.title || 'N/A'}</td>
                    <td>${event.location || 'N/A'}</td>
                    <td>${event.max_capacity || 0}</td>
                    <td>${event.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A'} ${event.time ? event.time : ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

</body>
</html>`;

  return htmlContent;
}

// Generate event participants report
function generateEventParticipantsReport(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
      console.log('📊 Event participants report data keys:', Object.keys(reportData));
    } catch (e) {
      console.error('Error parsing event participants report data:', e);
    }
  }

  const participants = reportData.participants || [];
  const totalParticipants = participants.length;
  const eventInfo = reportData.event || {};

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Participant List - Cagayan de Oro City Museum</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #000;
            line-height: 1.4;
            background: #ffffff;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding: 0;
        }
        
        .seal {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
        }
        
        .seal img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .museum-info {
            text-align: center;
            flex: 1;
            margin: 0 20px;
        }
        
        .museum-name {
            font-size: 20px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        
        .museum-address {
            font-size: 12px;
            color: #666;
            line-height: 1.3;
        }
        
        .city-logo {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
        }
        
        .city-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .report-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin: 30px 0;
        }
        
        .total-participants {
            text-align: right;
            font-size: 14px;
            margin-bottom: 20px;
            color: #000;
        }
        
        .event-details {
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        .event-details div {
            margin-bottom: 8px;
        }
        
        .event-details strong {
            font-weight: bold;
        }
        
        .participants-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 20px;
        }
        
        .participants-table th,
        .participants-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        .participants-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .participants-table td {
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="seal">
            <img src="data:image/png;base64,${getBase64Logo('logo.png')}" alt="City Seal" />
        </div>
        <div class="museum-info">
            <div class="museum-name">Cagayan de Oro City Museum</div>
            <div class="museum-address">
                Fernandez-Rizal Streets, Barangay 1, Old Water Tower/Tank,<br>
                near Gaston Park, Cagayan de Oro, Philippines
            </div>
        </div>
        <div class="city-logo">
            <img src="data:image/png;base64,${getBase64Logo('Logo_cagayan_de oro_city.png')}" alt="City Logo" />
        </div>
    </div>

    <div class="report-title">Participant List</div>

    <div class="total-participants">Total Participant: ${totalParticipants}</div>

    <div class="event-details">
        <div><strong>Event Name:</strong> ${eventInfo.title || 'N/A'}</div>
        <div><strong>Location:</strong> ${eventInfo.location || 'N/A'}</div>
        <div><strong>Date and Time:</strong> ${eventInfo.start_date ? new Date(eventInfo.start_date).toLocaleDateString() : 'N/A'} ${eventInfo.time ? eventInfo.time : ''}</div>
    </div>

    <table class="participants-table">
        <thead>
            <tr>
                <th>Participant Name</th>
                <th>Gender</th>
                <th>Email</th>
                <th>Visitor type</th>
            </tr>
        </thead>
        <tbody>
            ${participants.map(participant => `
                <tr>
                    <td>${(participant.firstname || '') + ' ' + (participant.lastname || '') || 'N/A'}</td>
                    <td>${participant.gender || 'N/A'}</td>
                    <td>${participant.email || 'N/A'}</td>
                    <td>${participant.visitor_type || 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

</body>
</html>`;

  return htmlContent;
}

module.exports = {
  generateEventListReport,
  generateEventParticipantsReport
};
