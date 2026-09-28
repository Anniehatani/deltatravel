#!/usr/bin/env node

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const WEB = (process.env.LIVE_WEB_URL || 'https://delta-travel-web.onrender.com').replace(
  /\/$/,
  '',
);
const routes = ['/', '/tours', '/assistant', '/login', '/register'];

const browser = await chromium.launch({ headless: true });
let violationCount = 0;

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  for (const route of routes) {
    await page.goto(WEB + route, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(800);

    const result = await new AxeBuilder({ page }).analyze();
    violationCount += result.violations.length;

    console.log(`A11Y ${route}: violations=${result.violations.length}`);
    for (const violation of result.violations) {
      console.log(`  - [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}`);
      for (const node of violation.nodes.slice(0, 5)) {
        console.log(`    target: ${JSON.stringify(node.target)}`);
      }
    }
  }
} finally {
  await browser.close();
}

if (violationCount > 0) {
  throw new Error(
    `Accessibility audit found ${violationCount} rule violations across public routes`,
  );
}

console.log('\nA11Y_AUDIT_PASS violations=0');
