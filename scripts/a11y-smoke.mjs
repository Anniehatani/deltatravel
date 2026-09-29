#!/usr/bin/env node

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const WEB = (process.env.LIVE_WEB_URL || 'https://delta-travel-web.onrender.com').replace(
  /\/$/,
  '',
);

const routes = [
  '/',
  '/tours',
  '/assistant',
  '/login',
  '/register',
  '/forgot-password',
  '/payments/return',
  '/bookings',
  '/admin',
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch({ headless: true });
let violationCount = 0;

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    await context.addInitScript(() => {
      window.sessionStorage.setItem('delta_intro_played', 'true');
    });
    const page = await context.newPage();

    for (const route of routes) {
      const response = await page.goto(WEB + route, {
        waitUntil: 'domcontentloaded',
        timeout: 120000,
      });
      if (!response || response.status() >= 400) {
        throw new Error(
          `A11Y ${viewport.name} ${route} returned HTTP ${response?.status() ?? 'no-response'}`,
        );
      }
      await page.waitForTimeout(800);

      const result = await new AxeBuilder({ page }).analyze();
      violationCount += result.violations.length;
      console.log(
        `A11Y ${viewport.name} ${viewport.width}x${viewport.height} ${route}: violations=${result.violations.length}`,
      );
      for (const violation of result.violations) {
        console.log(`  - [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}`);
        for (const node of violation.nodes.slice(0, 8)) {
          console.log(`    target: ${JSON.stringify(node.target)}`);
        }
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (violationCount > 0) {
  throw new Error(
    `Accessibility audit found ${violationCount} rule violation(s) across audited routes/viewports`,
  );
}

console.log('\nA11Y_AUDIT_PASS violations=0');
