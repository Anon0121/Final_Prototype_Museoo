const puppeteer = require('puppeteer');

/**
 * Render an HTML string to a PDF Buffer using Puppeteer.
 * Falls back to throwing if Chromium cannot launch.
 * @param {string} html
 * @returns {Promise<Buffer>}
 */
async function htmlToPdfBuffer(html) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '12mm', bottom: '20mm', left: '12mm' }
    });
    return pdf;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { htmlToPdfBuffer };















