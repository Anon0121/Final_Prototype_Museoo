const fs = require('fs');
const path = require('path');

// Read the ERD Mermaid file
const erdPath = path.join(__dirname, 'docs', 'diagrams', 'erd.mmd');
const htmlPath = path.join(__dirname, 'erd-diagram.html');

try {
  const erdContent = fs.readFileSync(erdPath, 'utf8');
  
  // Create HTML file with Mermaid
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Museum Management System - Entity Relationship Diagram</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .description {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1em;
            line-height: 1.6;
        }
        .mermaid {
            text-align: center;
            margin: 20px 0;
        }
        .legend {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .legend h3 {
            color: #007bff;
            margin-top: 0;
        }
        .legend ul {
            list-style-type: none;
            padding-left: 0;
        }
        .legend li {
            margin: 8px 0;
            padding: 5px 0;
        }
        .legend .entity {
            font-weight: bold;
            color: #495057;
        }
        .legend .relationship {
            color: #6c757d;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏛️ Museum Management System</h1>
        <h2 style="text-align: center; color: #495057;">Entity Relationship Diagram (ERD)</h2>
        
        <div class="description">
            This diagram shows the complete database schema for the Museum Management System, 
            including all tables, their relationships, and key attributes. The system manages 
            visitors, cultural objects, events, donations, and administrative functions.
        </div>

        <div class="mermaid">
${erdContent}
        </div>

        <div class="legend">
            <h3>📋 Database Schema Overview</h3>
            <ul>
                <li><span class="entity">User Management:</span> <span class="relationship">SYSTEM_USER, USER_PERMISSIONS, USER_ACTIVITY_LOGS</span></li>
                <li><span class="entity">Visitor Management:</span> <span class="relationship">VISITORS, ADDITIONAL_VISITORS, BOOKINGS</span></li>
                <li><span class="entity">Activity Management:</span> <span class="relationship">ACTIVITIES, EVENT_DETAILS, EVENT_REGISTRATIONS</span></li>
                <li><span class="entity">Cultural Objects:</span> <span class="relationship">CULTURAL_OBJECTS, OBJECT_DETAILS</span></li>
                <li><span class="entity">Donations:</span> <span class="relationship">DONATIONS, DONATION_DETAILS</span></li>
                <li><span class="entity">Archives:</span> <span class="relationship">ARCHIVES</span></li>
                <li><span class="entity">Media:</span> <span class="relationship">IMAGES</span></li>
                <li><span class="entity">Reports:</span> <span class="relationship">REPORTS</span></li>
            </ul>
            
            <h3>🔗 Key Relationships</h3>
            <ul>
                <li><strong>One-to-Many:</strong> A booking can have multiple visitors</li>
                <li><strong>One-to-Many:</strong> An activity can have multiple event details</li>
                <li><strong>One-to-Many:</strong> A cultural object can have multiple detailed attributes</li>
                <li><strong>One-to-Many:</strong> A donation can have multiple detail records</li>
                <li><strong>Many-to-Many:</strong> Activities and cultural objects can have multiple images</li>
            </ul>
        </div>
    </div>

    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            },
            er: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });
    </script>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent);
  console.log('✅ ERD HTML file created: erd-diagram.html');
  console.log('📋 To generate SVG:');
  console.log('1. Open erd-diagram.html in a web browser');
  console.log('2. Right-click on the diagram and select "Save image as..."');
  console.log('3. Choose SVG format');
  console.log('');
  console.log('🔄 Alternative: Use Mermaid CLI if installed:');
  console.log('mmdc -i docs/diagrams/erd.mmd -o erd-diagram.svg');

} catch (error) {
  console.error('❌ Error generating ERD:', error.message);
}
