#!/usr/bin/env node

import { chromium, firefox } from 'playwright';

const WEB = (process.env.LIVE_WEB_URL || 'https://delta-travel-web.onrender.com').replace(
  /\/$/,
  '',
);
const publicRoutes = [
  '/',
  '/tours',
  '/assistant',
  '/login',
  '/register',
  '/forgot-password',
  '/payments/return',
];

async function assertBasicAccessibility(page, name, route) {
  const missingAlt = await page.locator('img:not([alt])').count();
  if (missingAlt > 0) throw new Error(`${name} ${route} has ${missingAlt} image(s) without alt`);

  const unnamedButtons = await page.locator('button').evaluateAll(
    (buttons) =>
      buttons.filter((button) => {
        const text = button.textContent?.trim();
        const label = button.getAttribute('aria-label')?.trim();
        const title = button.getAttribute('title')?.trim();
        return !text && !label && !title;
      }).length,
  );
  if (unnamedButtons > 0) {
    throw new Error(`${name} ${route} has ${unnamedButtons} unnamed button(s)`);
  }

  const unnamedLinks = await page.locator('a').evaluateAll(
    (links) =>
      links.filter((link) => {
        const text = link.textContent?.trim();
        const label = link.getAttribute('aria-label')?.trim();
        const title = link.getAttribute('title')?.trim();
        const imageAlt = link.querySelector('img')?.getAttribute('alt')?.trim();
        return !text && !label && !title && !imageAlt;
      }).length,
  );
  if (unnamedLinks > 0) {
    throw new Error(`${name} ${route} has ${unnamedLinks} unnamed link(s)`);
  }

  if ((await page.locator('main').count()) === 0) {
    throw new Error(`${name} ${route} is missing the main landmark`);
  }
}

async function openRoute(page, name, viewport, route) {
  const response = await page.goto(WEB + route, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  if (!response || response.status() >= 400) {
    throw new Error(`${name} ${route} returned HTTP ${response?.status() ?? 'no-response'}`);
  }
  await page.waitForTimeout(500);
  const body = (await page.locator('body').innerText()).trim();
  if (body.length < 20) throw new Error(`${name} ${route} rendered unexpectedly little content`);
  await assertBasicAccessibility(page, name, route);
  console.log(`PASS  ${name} ${viewport.width}x${viewport.height} ${route}`);
}

async function assertAuthGate(page, name, viewport, route) {
  await openRoute(page, name, viewport, route);
  await page.locator('a[href="/login"]').first().waitFor({ state: 'visible', timeout: 30000 });
  const leakedDashboard = await page
    .getByText('Trung Tâm Điều Hành Delta Travel', { exact: true })
    .count();
  if (leakedDashboard > 0) throw new Error(`${name} ${route} exposed protected admin content`);
  console.log(`PASS  ${name} auth gate ${route}`);
}

async function runEngine(name, engine, viewport) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));

    for (const route of publicRoutes) {
      await openRoute(page, name, viewport, route);
    }

    await assertAuthGate(page, name, viewport, '/bookings');
    await assertAuthGate(page, name, viewport, '/admin');

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
