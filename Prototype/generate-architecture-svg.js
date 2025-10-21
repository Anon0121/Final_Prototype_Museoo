const fs = require('fs');
const path = require('path');

// Read the Mermaid diagram content
const mermaidContent = fs.readFileSync('docs/diagrams/architecture.mmd', 'utf8');

// Create HTML file that will render the Mermaid diagram
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Museoo System Architecture</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: white;
        }
        .mermaid {
            text-align: center;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <h1>Museoo Museum Management System - Architecture Diagram</h1>
    <div class="mermaid">
${mermaidContent}
    </div>
    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            }
        });
    </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync('architecture-diagram.html', htmlContent);

console.log('✅ HTML file created: architecture-diagram.html');
console.log('📋 To generate SVG:');
console.log('1. Open architecture-diagram.html in a web browser');
console.log('2. Right-click on the diagram and select "Save image as..."');
console.log('3. Choose SVG format');
console.log('');
console.log('🔄 Alternative: Use Mermaid CLI if installed:');
console.log('npm install -g @mermaid-js/mermaid-cli');
console.log('mmdc -i docs/diagrams/architecture.mmd -o architecture-diagram.svg');











