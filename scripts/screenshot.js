const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone size

  const errors = {};

  const pages = [
    { url: 'http://localhost:3000', name: 'dashboard' },
    { url: 'http://localhost:3000/loans', name: 'loans' },
    { url: 'http://localhost:3000/people', name: 'people' },
    { url: 'http://localhost:3000/loans/L001', name: 'loan-detail' },
  ];

  for (const p of pages) {
    const pageErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') pageErrors.push('CONSOLE: ' + msg.text()); });
    page.on('pageerror', err => pageErrors.push('PAGEERROR: ' + err.message));

    try {
      const response = await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const screenshotPath = `C:/Users/I344101/sap_vibe_dev/HandLoans/test-screenshots/${p.name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });

      const title = await page.title();
      const url = page.url();

      console.log(`=== ${p.name} ===`);
      console.log(`URL: ${url}`);
      console.log(`Title: ${title}`);
      console.log(`HTTP Status: ${response ? response.status() : 'unknown'}`);
      console.log(`Screenshot: ${screenshotPath}`);

      if (pageErrors.length > 0) {
        console.log(`Errors (${pageErrors.length}):`);
        pageErrors.forEach(e => console.log('  ' + e));
      } else {
        console.log('Errors: none');
      }
      console.log('');

      errors[p.name] = pageErrors;
    } catch (err) {
      console.log(`=== ${p.name} ===`);
      console.log(`FAILED: ${err.message}`);
      errors[p.name] = [err.message];
      console.log('');
    }
  }

  console.log('=== SUMMARY ===');
  let totalErrors = 0;
  for (const [name, errs] of Object.entries(errors)) {
    totalErrors += errs.length;
    console.log(`${name}: ${errs.length === 0 ? 'OK' : errs.length + ' error(s)'}`);
  }
  console.log(`Total errors: ${totalErrors}`);

  await browser.close();
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
