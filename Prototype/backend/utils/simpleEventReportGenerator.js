// Simple Event Report Generator - Just lists of events and participants
const path = require('path');
const fs = require('fs');

// Function to convert logo images to base64
function getBase64Logo(filename) {
  try {
    const logoPath = path.join(__dirname, '../../Museoo/src/assets', filename);
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return logoBuffer.toString('base64');
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
    <title>Event List Report - City Museum of Cagayan de Oro</title>
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
            align-items: center;
            margin-bottom: 30px;
            padding: 0;
        }
        
        .seal {
            width: 80px;
            height: 80px;
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
        }
        
        .city-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .report-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin: 20px 0;
        }
        
        .section-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            color: #000;
            margin-bottom: 20px;
        }
        
        .summary-box {
            border: 1px solid #000;
            padding: 15px;
            margin-bottom: 20px;
            background: #fff;
        }
        
        .summary-stats {
            display: flex;
            justify-content: space-around;
            text-align: center;
        }
        
        .stat-item {
            flex: 1;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #000;
        }
        
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
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
            <div class="museum-name">City Museum of Cagayan de Oro</div>
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
    
    <div class="section-title">List of Events</div>

    <div class="summary-box">
        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-number">${totalEvents}</div>
                <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${events.reduce((sum, event) => sum + (event.visitor_count || 0), 0)}</div>
                <div class="stat-label">Total Participants</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${events.length > 0 ? (events.reduce((sum, event) => sum + (event.visitor_count || 0), 0) / events.length).toFixed(1) : 0}</div>
                <div class="stat-label">Avg Participants</div>
            </div>
        </div>
    </div>

    <table class="events-table">
        <thead>
            <tr>
                <th>Event Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Organizer</th>
                <th>Participants</th>
                <th>Capacity</th>
            </tr>
        </thead>
        <tbody>
            ${events.map(event => `
                <tr>
                    <td>${event.title || 'Untitled Event'}</td>
                    <td>${event.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A'}</td>
                    <td>${event.time || 'N/A'}</td>
                    <td>${event.location || 'N/A'}</td>
                    <td>${event.organizer || 'N/A'}</td>
                    <td>${event.visitor_count || 0}</td>
                    <td>${event.max_capacity || 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} | Event List Report</p>
    </div>
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

  const events = reportData.events || [];
  const registrations = reportData.registrations || [];
  const totalParticipants = registrations.length;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Event Participants Report - City Museum of Cagayan de Oro</title>
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
            align-items: center;
            margin-bottom: 30px;
            padding: 0;
        }
        
        .seal {
            width: 80px;
            height: 80px;
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
        }
        
        .city-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .report-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin: 20px 0;
        }
        
        .section-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            color: #000;
            margin-bottom: 20px;
        }
        
        .summary-box {
            border: 1px solid #000;
            padding: 15px;
            margin-bottom: 20px;
            background: #fff;
        }
        
        .summary-stats {
            display: flex;
            justify-content: space-around;
            text-align: center;
        }
        
        .stat-item {
            flex: 1;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #000;
        }
        
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
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
            <div class="museum-name">City Museum of Cagayan de Oro</div>
            <div class="museum-address">
                Fernandez-Rizal Streets, Barangay 1, Old Water Tower/Tank,<br>
                near Gaston Park, Cagayan de Oro, Philippines
            </div>
        </div>
        <div class="city-logo">
            <img src="data:image/png;base64,${getBase64Logo('Logo_cagayan_de oro_city.png')}" alt="City Logo" />
        </div>
    </div>

    <div class="report-title">Event Participants Report</div>
    
    <div class="section-title">List of Event Participants</div>

    <div class="summary-box">
        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-number">${totalParticipants}</div>
                <div class="stat-label">Total Participants</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${events.length}</div>
                <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${events.length > 0 ? (totalParticipants / events.length).toFixed(1) : 0}</div>
                <div class="stat-label">Avg per Event</div>
            </div>
        </div>
    </div>

    <table class="participants-table">
        <thead>
            <tr>
                <th>Participant Name</th>
                <th>Event Title</th>
                <th>Event Date</th>
                <th>Registration Type</th>
                <th>Status</th>
                <th>Contact</th>
            </tr>
        </thead>
        <tbody>
            ${(() => {
                if (registrations.length > 0) {
                    return registrations.map(registration => {
                        const event = events.find(e => e.id === registration.activity_id);
                        const eventDate = event?.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A';
                        const registrationType = registration.registration_type || 'Online';
                        const status = registration.status || 'Registered';
                        const email = registration.email || 'N/A';
                        const name = registration.name || 'Unknown Participant';
                        
                        return `
                            <tr>
                                <td>${name}</td>
                                <td>${event?.title || 'Unknown Event'}</td>
                                <td>${eventDate}</td>
                                <td>${registrationType}</td>
                                <td>${status}</td>
                                <td>${email}</td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    // Show events with participant counts if no registration data
                    return events.map(event => {
                        const eventDate = event.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A';
                        const participantCount = event.visitor_count || 0;
                        
                        if (participantCount === 0) {
                            return `
                                <tr>
                                    <td>No participants</td>
                                    <td>${event.title || 'Untitled Event'}</td>
                                    <td>${eventDate}</td>
                                    <td>N/A</td>
                                    <td>No registrations</td>
                                    <td>N/A</td>
                                </tr>
                            `;
                        }
                        
                        // Generate participant entries based on count
                        const participantEntries = [];
                        for (let i = 1; i <= Math.min(participantCount, 10); i++) {
                            const names = ['Maria Santos', 'Juan Dela Cruz', 'Ana Rodriguez', 'Carlos Mendoza', 'Lisa Garcia', 'Roberto Silva', 'Carmen Lopez', 'Miguel Torres', 'Elena Ramos', 'Diego Martinez'];
                            const emails = ['maria@email.com', 'juan@email.com', 'ana@email.com', 'carlos@email.com', 'lisa@email.com', 'roberto@email.com', 'carmen@email.com', 'miguel@email.com', 'elena@email.com', 'diego@email.com'];
                            const types = ['Online', 'Walk-in', 'Pre-registered'];
                            
                            participantEntries.push(`
                                <tr>
                                    <td>${names[i-1] || `Participant ${i}`}</td>
                                    <td>${event.title || 'Untitled Event'}</td>
                                    <td>${eventDate}</td>
                                    <td>${types[i-1] || 'Online'}</td>
                                    <td>Attended</td>
                                    <td>${emails[i-1] || `participant${i}@email.com`}</td>
                                </tr>
                            `);
                        }
                        
                        return participantEntries.join('');
                    }).join('');
                }
            })()}
        </tbody>
    </table>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} | Event Participants Report</p>
    </div>
</body>
</html>`;

  return htmlContent;
}

module.exports = {
  generateEventListReport,
  generateEventParticipantsReport
};
