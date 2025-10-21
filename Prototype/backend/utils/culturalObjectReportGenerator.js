const puppeteer = require('puppeteer');
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

// Function to convert uploaded images to base64
function getBase64Image(imagePath) {
  try {
    if (!imagePath || imagePath === 'null' || imagePath === '') {
      return null;
    }
    
    let fullPath;
    if (imagePath.startsWith('/uploads/')) {
      // Convert relative path to absolute path
      fullPath = path.join(__dirname, '..', imagePath);
    } else if (imagePath.startsWith('http')) {
      // It's already a full URL, return as is
      return imagePath;
    } else {
      // Try as absolute path
      fullPath = imagePath;
    }
    
    if (fs.existsSync(fullPath)) {
      const imageBuffer = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                      ext === '.png' ? 'image/png' : 
                      ext === '.gif' ? 'image/gif' : 'image/jpeg';
      
      return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    } else {
      console.log(`Image file not found: ${fullPath}`);
      return null;
    }
  } catch (error) {
    console.error(`Error reading image ${imagePath}:`, error);
    return null;
  }
}

// Generate Cultural Object Report HTML with the specific format
function generateCulturalObjectReportHTML(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
    } catch (e) {
      console.error('Error parsing report data:', e);
    }
  }

  // Create HTML content matching the cultural object report format
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cultural Object Report - City Museum of Cagayan de Oro</title>
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
            background: white;
        }
        
        .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 20px 0;
        }
        
        .seal {
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .seal img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .museum-info {
            flex: 1;
            text-align: center;
            margin: 0 20px;
        }
        
        .museum-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #000;
        }
        
        .museum-address {
            font-size: 11px;
            color: #333;
            line-height: 1.3;
            max-width: 400px;
            margin: 0 auto;
        }
        
        .city-logo {
            width: 120px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
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
            margin-bottom: 40px;
            color: #000;
        }
        
        .object-section {
            margin-bottom: 50px;
            page-break-inside: avoid;
        }
        
        .object-header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
        }
        
        .object-label {
            font-weight: bold;
            font-size: 14px;
            margin-right: 20px;
            margin-top: 5px;
            min-width: 70px;
            color: #000;
        }
        
        .object-image {
            width: 150px;
            height: 110px;
            border: 2px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 25px;
            background: #fff;
            position: relative;
            flex-shrink: 0;
        }
        
        .object-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .example-stamp {
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            font-weight: bold;
            font-size: 18px;
            transform: rotate(-8deg);
            border-radius: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .object-details {
            flex: 1;
            font-size: 12px;
        }
        
        .detail-row {
            margin-bottom: 6px;
            display: flex;
            align-items: flex-start;
        }
        
        .detail-label {
            font-weight: bold;
            min-width: 140px;
            margin-right: 8px;
            color: #000;
        }
        
        .detail-value {
            color: #000;
            font-style: normal;
        }
        
        .description {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #ccc;
        }
        
        .description .detail-label {
            min-width: 140px;
        }
        
        @media print {
            body { margin: 0; padding: 15px; }
            .object-section { page-break-inside: avoid; }
            .object-header { page-break-inside: avoid; }
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

    <div class="report-title">Cultural Object Report</div>

    ${reportData.objects && reportData.objects.length > 0 ? 
      reportData.objects.map((object, index) => `
        <div class="object-section">
            <div class="object-header">
                <div class="object-label">OBJECT ${index + 1}</div>
                <div class="object-image">
                    ${(() => {
                      // Try multiple possible image sources
                      const imageUrl = object.primaryImage?.image_url || 
                                     object.primaryImage?.url ||
                                     object.image_url || 
                                     object.url ||
                                     (object.images && object.images.length > 0 ? object.images[0].image_url || object.images[0].url : null);
                      
                      if (imageUrl && imageUrl !== 'null' && imageUrl !== '' && imageUrl !== 'undefined') {
                        // Try to convert image to base64 for PDF generation
                        const base64Image = getBase64Image(imageUrl);
                        
                        if (base64Image) {
                          console.log('Successfully converted image to base64 for:', object.name);
                          return `<img src="${base64Image}" alt="${object.name}" style="width: 100%; height: 100%; object-fit: cover;" />`;
                        } else {
                          console.log('Could not convert image to base64, showing EXAMPLE stamp for:', object.name);
                          return `<div class="example-stamp">EXAMPLE</div>`;
                        }
                      } else {
                        console.log('No image URL found for object:', object.name);
                        return `<div class="example-stamp">EXAMPLE</div>`;
                      }
                    })()}
                </div>
                <div class="object-details">
                    <div class="detail-row">
                        <div class="detail-label">Name:</div>
                        <div class="detail-value">"${object.name || 'Name of the Cultural Object'}"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Category:</div>
                        <div class="detail-value">"${object.category || 'Category of the Cultural Object'}"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Origin:</div>
                        <div class="detail-value">"${object.origin || 'Origin of the Cultural Object'}"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Material:</div>
                        <div class="detail-value">"${object.material || 'Material of the Cultural Object'}"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Acquisition Date:</div>
                        <div class="detail-value">"${object.acquisition_date || 'Acquisition Date of the Cultural Object'}"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Location of Object:</div>
                        <div class="detail-value">"${object.current_location || 'Location of the Cultural Object'}"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Estimated Value:</div>
                        <div class="detail-value">"${object.estimated_value || 'Estimated Value of the Cultural Object'}"</div>
                    </div>
                    <div class="description">
                        <div class="detail-row">
                            <div class="detail-label">Description:</div>
                            <div class="detail-value">"${object.description || 'Description of the Cultural Object'}"</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      `).join('') :
      `
        <div class="object-section">
            <div class="object-header">
                <div class="object-label">OBJECT 1</div>
                <div class="object-image">
                    <div class="example-stamp">EXAMPLE</div>
                </div>
                <div class="object-details">
                    <div class="detail-row">
                        <div class="detail-label">Name:</div>
                        <div class="detail-value">"Name of the Cultural Object"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Category:</div>
                        <div class="detail-value">"Category of the Cultural Object"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Origin:</div>
                        <div class="detail-value">"Origin of the Cultural Object"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Material:</div>
                        <div class="detail-value">"Material of the Cultural Object"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Acquisition Date:</div>
                        <div class="detail-value">"Acquisition Date of the Cultural Object"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Location of Object:</div>
                        <div class="detail-value">"Location of the Cultural Object"</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Estimated Value:</div>
                        <div class="detail-value">"Estimated Value of the Cultural Object"</div>
                    </div>
                    <div class="description">
                        <div class="detail-row">
                            <div class="detail-label">Description:</div>
                            <div class="detail-value">"Description of the Cultural Object"</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      `
    }
</body>
</html>
  `;

  return htmlContent;
}

// Generate PDF from HTML
async function generateCulturalObjectReportPDFBuffer(report) {
  try {
    const htmlContent = generateCulturalObjectReportHTML(report);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating cultural object report PDF:', error);
    throw error;
  }
}

module.exports = { 
  generateCulturalObjectReportPDF: generateCulturalObjectReportHTML,
  generateCulturalObjectReportPDFBuffer 
};
