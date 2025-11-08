const puppeteer = require('puppeteer');

// Browser instance pool for reuse (singleton pattern)
let browserInstance = null;
let browserLaunchPromise = null;

/**
 * Get or create a browser instance (reused across requests for better performance)
 */
async function getBrowser() {
  if (browserInstance) {
    return browserInstance;
  }
  
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }
  
  browserLaunchPromise = puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Overcome limited resource problems
      '--disable-gpu', // Disable GPU hardware acceleration
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-ipc-flooding-protection'
    ],
    timeout: 30000 // 30 second launch timeout
  }).then(browser => {
    browserInstance = browser;
    browserLaunchPromise = null;
    
    // Handle browser disconnection
    browser.on('disconnected', () => {
      browserInstance = null;
      browserLaunchPromise = null;
    });
    
    return browser;
  }).catch(err => {
    browserLaunchPromise = null;
    throw err;
  });
  
  return browserLaunchPromise;
}

/**
 * Render an HTML string to a PDF Buffer using Puppeteer.
 * Uses a shared browser instance for better performance.
 * @param {string} html
 * @returns {Promise<Buffer>}
 */
async function htmlToPdfBuffer(html) {
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Optimize page settings for faster rendering
    await page.setViewport({ width: 1200, height: 800 });
    
    // Use 'load' instead of 'networkidle0' for faster rendering
    // 'load' waits for the load event, which is sufficient for most cases
    await page.setContent(html, { 
      waitUntil: 'load', // Changed from 'networkidle0' for better performance
      timeout: 30000 // 30 second timeout
    });
    
    // Generate PDF with optimized settings
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '12mm', bottom: '20mm', left: '12mm' },
      preferCSSPageSize: false, // Faster rendering
      displayHeaderFooter: false // Disable if not needed
    });
    
    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (page) {
      await page.close().catch(() => {}); // Close page, keep browser open
    }
  }
}

/**
 * Close the browser instance (call this on server shutdown)
 */
async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    browserLaunchPromise = null;
  }
}

module.exports = { htmlToPdfBuffer, closeBrowser };
















