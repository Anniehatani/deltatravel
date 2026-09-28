#!/usr/bin/env node

import { chromium, firefox } from 'playwright';

const WEB = (process.env.LIVE_WEB_URL || 'https://delta-travel-web.onrender.com').replace(
  /\/$/,
  '',
);
const routes = ['/', '/tours', '/assistant', '/login', '/register'];

async function runEngine(name, engine, viewport) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));

    for (const route of routes) {
      const response = await page.goto(WEB + route, {
        waitUntil: 'domcontentloaded',
        timeout: 120000,
      });
      if (!response || response.status() >= 400) {
        throw new Error(`${name} ${route} returned HTTP ${response?.status() ?? 'no-response'}`);
      }
      await page.waitForTimeout(500);
      const body = (await page.locator('body').innerText()).trim();
      if (body.length < 20)
        throw new Error(`${name} ${route} rendered unexpectedly little content`);
      console.log(`PASS  ${name} ${viewport.width}x${viewport.height} ${route}`);
    }

    if (pageErrors.length) {
      throw new Error(`${name} page errors: ${pageErrors.join(' | ')}`);
    }
  } finally {
    await browser.close();
  }
}

await runEngine('chromium-desktop', chromium, { width: 1440, height: 900 });
await runEngine('chromium-mobile', chromium, { width: 390, height: 844 });
await runEngine('firefox-desktop', firefox, { width: 1440, height: 900 });

console.log('\nBROWSER_SMOKE_PASS');
