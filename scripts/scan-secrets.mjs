#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const patterns = [
  ['Groq API key', new RegExp(['gsk', '[A-Za-z0-9]{20,}'].join('_'), 'g')],
  ['OpenAI API key', new RegExp(['sk', '(?:proj-)?[A-Za-z0-9_-]{20,}'].join('-'), 'g')],
  ['Supabase secret key', new RegExp(['sb', 'secret', '[A-Za-z0-9_-]{20,}'].join('_'), 'g')],
  ['GitHub token', /gh[pousr]_[A-Za-z0-9]{20,}/g],
  ['AWS access key', /AKIA[0-9A-Z]{16}/g],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];

const skip = new Set(['scripts/scan-secrets.mjs']);
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const findings = [];

for (const file of files) {
  if (skip.has(file)) continue;
  let stat;
  try {
    stat = statSync(file);
  } catch {
    continue;
  }
  if (!stat.isFile() || stat.size > 1024 * 1024) continue;
  const buffer = readFileSync(file);
  if (buffer.includes(0)) continue;
  const text = buffer.toString('utf8');

  for (const [label, regex] of patterns) {
    regex.lastIndex = 0;
    for (const match of text.matchAll(regex)) {
      findings.push({ file, label, index: match.index ?? 0 });
    }
  }
}

if (findings.length) {
  console.error('Potential committed secret material detected:');
  for (const item of findings) console.error(`- ${item.label}: ${item.file} @ ${item.index}`);
  process.exit(1);
}

console.log(`Secret scan PASS across ${files.length} tracked paths.`);
