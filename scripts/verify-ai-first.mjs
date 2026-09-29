#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const requirements = [
  ['global AI command center', 'apps/web/src/app/layout.tsx', '<AiAgentLauncher'],
  ['homepage live AI planner', 'apps/web/src/app/page.tsx', '<AiContextCard'],
  ['tour discovery AI', 'apps/web/src/app/(public)/tours/page.tsx', '<AiContextCard'],
  ['AI-ranked tour catalog', 'apps/web/src/app/(public)/tours/page.tsx', 'aiRecommendedIds'],
  ['tour detail AI fit advisor', 'apps/web/src/app/(public)/tours/[id]/page.tsx', '<AiContextCard'],
  [
    'checkout AI preflight',
    'apps/web/src/app/(account)/checkout/[scheduleId]/page.tsx',
    '<AiContextCard',
  ],
  ['booking list AI concierge', 'apps/web/src/app/(account)/bookings/page.tsx', '<AiContextCard'],
  [
    'booking detail AI concierge',
    'apps/web/src/app/(account)/bookings/[id]/page.tsx',
    '<AiContextCard',
  ],
  ['admin AI copilot layer', 'apps/web/src/app/admin/layout.tsx', '<AdminAiCopilotStrip'],
  ['assistant action agent', 'apps/web/src/app/assistant/page.tsx', '<AgentBookingPanel'],
  ['context seeded agent', 'apps/web/src/components/agent-booking-panel.tsx', 'initialScheduleId'],
  ['page-aware launcher', 'apps/web/src/components/ai-agent-launcher.tsx', 'contextForPath'],
  [
    'account-aware AI helper',
    'apps/web/src/components/ai-agent-launcher.tsx',
    "pathname === '/login'",
  ],
  [
    'payment-return AI helper',
    'apps/web/src/components/ai-agent-launcher.tsx',
    "pathname === '/payments/return'",
  ],
  ['grounded booking AI', 'apps/api/src/assistant/assistant.service.ts', 'intent.bookingId'],
  ['grounded operations AI', 'apps/api/src/admin/admin.service.ts', 'operationsOverview'],
  [
    'human approval checkpoint',
    'apps/api/src/assistant/travel-agent.service.ts',
    'requiresExplicitApproval',
  ],
];

const failures = [];
for (const [label, path, token] of requirements) {
  const content = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  if (!content.includes(token)) failures.push(label + ' -> ' + path + ' missing ' + token);
}

const launcher = readFileSync(
  new URL('../apps/web/src/components/ai-agent-launcher.tsx', import.meta.url),
  'utf8',
);
for (const [label, token] of [
  ['admin', "pathname.startsWith('/admin')"],
  ['checkout', 'const checkout = pathname.match'],
  ['booking', 'const booking = pathname.match'],
  ['tour', 'const tour = pathname.match'],
]) {
  if (!launcher.includes(token)) failures.push('page-aware launcher missing ' + label + ' context');
}

const agent = readFileSync(
  new URL('../apps/web/src/components/agent-booking-panel.tsx', import.meta.url),
  'utf8',
);
if (!agent.includes('...(scheduleId ? { scheduleId } : {})')) {
  failures.push('AI Agent does not pass seeded scheduleId into createPlan');
}

if (failures.length) {
  console.error('AI-first acceptance contract failed:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('AI_FIRST_SOURCE_CONTRACT_PASS requirements=' + requirements.length);
