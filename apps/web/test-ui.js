const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = '/tmp/screenshots';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro size
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  // 1. Dashboard
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '01-dashboard.png'), fullPage: false });
  console.log('✓ Dashboard loaded');

  // 2. Click a balance card (Arjun Kumar)
  await page.click('text=Arjun Kumar');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '02-person-arjun.png'), fullPage: false });
  console.log('✓ Person page (Arjun)');

  // 3. Click a loan card
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.goto('http://localhost:3000/loans/L001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '03-loan-detail.png'), fullPage: false });
  console.log('✓ Loan detail (L001)');

  // 4. Open Add Loan modal
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.click('button[aria-label="Add loan"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '04-add-loan-modal.png'), fullPage: false });
  console.log('✓ Add Loan modal');

  // 5. Fill and submit the Add Loan form
  await page.fill('input[placeholder="Enter name"]', 'Test User');
  await page.fill('input[placeholder="0"]', '5000');
  await page.fill('input[placeholder="e.g. Travel, Medical, Grocery"]', 'Test entry');
  await page.screenshot({ path: path.join(OUT, '05-add-loan-filled.png'), fullPage: false });

  await page.click('button:has-text("Add Loan")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, '06-after-add-loan.png'), fullPage: false });
  console.log('✓ Add Loan submitted');

  // 6. All loans page
  await page.goto('http://localhost:3000/loans', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '07-all-loans.png'), fullPage: false });
  console.log('✓ All loans page');

  // 7. Add Repayment modal
  await page.goto('http://localhost:3000/loans/L001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.click('button:has-text("Add Repayment")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '08-add-repayment-modal.png'), fullPage: false });
  console.log('✓ Add Repayment modal');

  // 8. People page
  await page.goto('http://localhost:3000/people', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '09-people.png'), fullPage: false });
  console.log('✓ People page');

  // Report
  console.log('\nConsole errors:', errors.length === 0 ? 'None' : errors.join('\n'));
  await browser.close();
})();
